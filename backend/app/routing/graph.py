from __future__ import annotations

import heapq
from typing import Any, Dict, Iterable, List, Optional, Tuple


class WalkingGraph:
    def __init__(self, nodes: Optional[Dict[str, Dict[str, float]]] = None, edges: Optional[List[Dict[str, Any]]] = None):
        self.nodes = nodes or {}
        self.edges = edges or []
        self.adjacency: Dict[str, List[Dict[str, Any]]] = {node_id: [] for node_id in self.nodes}

        for edge in self.edges:
            if "from" not in edge or "to" not in edge:
                continue
            self.adjacency.setdefault(edge["from"], []).append(edge)
            reverse_edge = dict(edge)
            reverse_edge["from"] = edge["to"]
            reverse_edge["to"] = edge["from"]
            self.adjacency.setdefault(edge["to"], []).append(reverse_edge)

    def nearest_node_for_point(self, lat: float, lng: float) -> str:
        if not self.nodes:
            raise ValueError("Graph has no nodes")

        nearest_id = None
        nearest_distance = None
        for node_id, point in self.nodes.items():
            distance = ((point["lat"] - lat) ** 2 + (point["lng"] - lng) ** 2) ** 0.5
            if nearest_distance is None or distance < nearest_distance:
                nearest_id = node_id
                nearest_distance = distance
        return nearest_id

    def shortest_path(self, start_id: str, end_id: str, strategy: str = "time") -> List[str]:
        if start_id == end_id:
            return [start_id]

        queue: List[Tuple[float, str]] = [(0.0, start_id)]
        best_cost: Dict[str, float] = {start_id: 0.0}
        prev: Dict[str, Optional[str]] = {start_id: None}

        while queue:
            current_cost, node_id = heapq.heappop(queue)
            if current_cost > best_cost.get(node_id, float("inf")):
                continue
            if node_id == end_id:
                break

            for edge in self.adjacency.get(node_id, []):
                next_id = edge["to"]
                candidate_cost = current_cost + self._edge_cost(edge, strategy)
                if candidate_cost < best_cost.get(next_id, float("inf")):
                    best_cost[next_id] = candidate_cost
                    prev[next_id] = node_id
                    heapq.heappush(queue, (candidate_cost, next_id))

        if end_id not in prev:
            raise ValueError(f"No path available between {start_id} and {end_id}")

        path: List[str] = []
        current = end_id
        while current is not None:
            path.append(current)
            current = prev[current]
        path.reverse()
        return path

    def route_geometry(self, node_path: Iterable[str]) -> List[Dict[str, float]]:
        geometry: List[Dict[str, float]] = []
        for node_id in list(node_path):
            point = self.nodes[node_id]
            geometry.append({"lat": point["lat"], "lng": point["lng"]})
        return geometry

    def path_metrics(self, node_path: List[str]) -> Dict[str, Any]:
        if len(node_path) < 2:
            return {
                "distance_m": 0.0,
                "duration_minutes": 0.0,
                "shade_score": 0.0,
                "lighting_score": 0.0,
                "accessible": True,
                "stairs": False,
            }

        total_distance = 0.0
        total_time = 0.0
        shade_total = 0.0
        lighting_total = 0.0
        stairs = False
        accessible = True

        for index in range(len(node_path) - 1):
            edge = self._find_edge(node_path[index], node_path[index + 1])
            if edge is None:
                continue
            total_distance += float(edge.get("distance_m", 0.0))
            total_time += float(edge.get("walking_time_s", 0.0))
            shade_total += float(edge.get("shade_score", 0.5))
            lighting_total += float(edge.get("lighting_score", 0.5))
            if edge.get("stairs"):
                stairs = True
            if not edge.get("accessible", True):
                accessible = False

        segment_count = max(1, len(node_path) - 1)
        return {
            "distance_m": total_distance,
            "duration_minutes": total_time / 60.0,
            "shade_score": shade_total / segment_count,
            "lighting_score": lighting_total / segment_count,
            "accessible": accessible,
            "stairs": stairs,
        }

    def _find_edge(self, from_id: str, to_id: str) -> Optional[Dict[str, Any]]:
        for edge in self.adjacency.get(from_id, []):
            if edge.get("to") == to_id:
                return edge
        return None

    @staticmethod
    def _edge_cost(edge: Dict[str, Any], strategy: str) -> float:
        base = float(edge.get("walking_time_s", 60))

        if strategy == "time":
            return base
        if strategy == "accessible":
            penalty = 0.0
            if not edge.get("accessible", True):
                penalty += 180.0
            if edge.get("stairs"):
                penalty += 120.0
            if edge.get("gradient", 0.0) > 3.0:
                penalty += 50.0
            return base + penalty
        if strategy == "shade":
            penalty = max(0.0, 1.0 - float(edge.get("shade_score", 0.5))) * 100.0
            return base + penalty
        if strategy == "night":
            penalty = max(0.0, 1.0 - float(edge.get("lighting_score", 0.5))) * 150.0
            return base + penalty
        if strategy == "comfort":
            shade_penalty = max(0.0, 1.0 - float(edge.get("shade_score", 0.5))) * 80.0
            lighting_penalty = max(0.0, 1.0 - float(edge.get("lighting_score", 0.5))) * 60.0
            return base + shade_penalty + lighting_penalty
        return base

    def path_between_points(self, start_lat: float, start_lng: float, end_lat: float, end_lng: float, strategy: str = "time") -> List[str]:
        start_node = self.nearest_node_for_point(start_lat, start_lng)
        end_node = self.nearest_node_for_point(end_lat, end_lng)
        return self.shortest_path(start_node, end_node, strategy=strategy)
