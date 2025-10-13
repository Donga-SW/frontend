'use client'

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

interface GraphComponentProps {
  onSelectNode?: (nodeKey: string | undefined) => void;
  selectedFile: string;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  setSearchActive?: (active: boolean) => void;
  dropdownOpen?: boolean;
  setDropdownOpen?: (open: boolean) => void;
  selectedNode?: string;
  onClearSelection?: () => void;
}

export default function GraphComponent({ onSelectNode, selectedFile, searchInputRef, setSearchActive, dropdownOpen, setDropdownOpen, selectedNode, onClearSelection }: GraphComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const datalistRef = useRef<HTMLDataListElement>(null);
  const setSearchQueryRef = useRef<(q: string) => void>(() => {});
  const rendererRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [state, setState] = useState<{
    hoveredNode?: string;
    hoveredNeighbors?: Set<string>;
    selectedNode?: string;
    selectedNeighbors?: Set<string>;
    searchQuery: string;
    suggestions?: Set<string>;
  }>({ searchQuery: "" });
  // 최신 state를 항상 참조할 수 있도록 useRef 사용
  const stateRef = useRef(state);
  stateRef.current = state;

  // 데이터 fetch
  useEffect(() => {
    fetch(`/data/${selectedFile}`)
      .then((res) => res.json())
      .then((json) => setGraphData(json));
  }, [selectedFile]);

  // sigma/graphology 및 예제 로직 적용
  useEffect(() => {
    if (!graphData || !containerRef.current) return;
    
    // 이미 렌더러가 존재하면 먼저 정리
    if (rendererRef.current) {
      rendererRef.current.kill();
      rendererRef.current = null;
    }
    
    let renderer: any;
    let graph: any;
    Promise.all([
      import("graphology"), 
      import("sigma")
    ]).then(([{ default: Graph }, { default: Sigma }]) => {
      //모든 노드를 노드화
      const nodesWithXY = graphData.nodes
        .map((node: any, idx: number) => {
          const { type, label, size, color, ...restAttrs } = node.attributes ?? node;
          
          let x =
            typeof node.attributes?.x === "number"
              ? node.attributes.x
              : typeof node.x === "number"
              ? node.x
              : Math.cos(idx) * 10;
          let y =
            typeof node.attributes?.y === "number"
              ? node.attributes.y
              : typeof node.y === "number"
              ? node.y
              : Math.sin(idx) * 10;
          if (typeof x !== "number" || isNaN(x)) x = 0;
          if (typeof y !== "number" || isNaN(y)) y = 0;
          
          // 전체 데이터셋일 때만 타입별로 노드 간격 넓히기
          if (selectedFile === '전체.json') {
            // 주소 노드는 특별히 더 넓게
            if (type === '주소') {
              x = x * 50;  // 주소 노드 간격 50배 (극도로 넓게)
              y = y * 50;
            } else {
              x = x * 30;  // 나머지도 30배로 대폭 증가
              y = y * 30;
            }
          }
          
          // 전체 데이터셋일 때는 크기를 1.3배만, 나머지는 2배
          let sizeMultiplier = selectedFile === '전체.json' ? 1.3 : 2;
          let baseSize = selectedFile === '전체.json' ? 15 : 20;
          
          // 전체와 기타일 때 주소 노드 크기 조정
          if ((selectedFile === '전체.json' || selectedFile === '기타.json') && type === '주소') {
            sizeMultiplier = 1.5;  // 주소는 1.5배 (조금 줄임)
            baseSize = 20;
          }
          
          return {
            ...node,
            attributes: {
              ...restAttrs,
              nodeType: type,  // type을 nodeType으로 변경 (Sigma 충돌 방지)
              x,
              y,
              label: label ?? node.label ?? node.id ?? node.key ?? String(idx),
              color: color ?? node.color ?? '#999',  // 원래 색상 유지
              size: typeof size === "number" && size > 0 ? size * sizeMultiplier : baseSize,
            },
          };
        });
      graph = new Graph();
      nodesWithXY.forEach((node: any) => {
        graph.addNode(node.key ?? node.id, node.attributes ?? node);
      });
      const nodeIds = new Set(nodesWithXY.map((node: any) => node.key ?? node.id));
      if (graphData.edges) {
        graphData.edges.forEach((edge: any) => {
          const source = edge.source;
          const target = edge.target;
          if (nodeIds.has(source) && nodeIds.has(target)) {
            const edgeAttrs = edge.attributes ?? edge;
            const edgeSize = selectedFile === '전체.json' ? 1 : 2;  // 전체일 때는 1, 나머지는 2
            graph.addEdge(source, target, {
              ...edgeAttrs,
              size: edgeSize
            });
          }
        });
      }
      renderer = new Sigma(graph, containerRef.current!, {
        enableEdgeEvents: true,
        renderLabels: true,
        labelRenderedSizeThreshold: 0,
        defaultEdgeType: "line",
        edgeLabelSize: 14,
        edgeLabelWeight: "bold"
      });
      rendererRef.current = renderer; // renderer 인스턴스를 ref에 저장
      renderer.refresh();
      renderer.refresh();
      
      // 전체 데이터셋일 때 초기 카메라 줌 조정
      if (selectedFile === '전체.json') {
        const camera = renderer.getCamera();
        camera.setState({
          x: 0.5,
          y: 0.5,
          ratio: 0.8  // 줌 레벨 (덜 확대)
        });
      }
      
      // 캔버스에 pointer-events 강제 적용
      const canvases = containerRef.current?.querySelectorAll("canvas");
      canvases?.forEach((c: any) => {
        c.style.pointerEvents = "auto";
      });
      if (datalistRef.current) {
        datalistRef.current.innerHTML = graph
          .nodes()
          .map((node: string) => `<option value="${graph.getNodeAttribute(node, "label") ?? node}"></option>`)
          .join("\n");
      }
      // 최신 stateRef를 참조하는 reducer/이벤트
      function setHoveredNode(node?: string) {
        if (node) {
          setState((prev) => {
            const next = { ...prev, hoveredNode: node, hoveredNeighbors: new Set<string>(graph.neighbors(node)) };
            stateRef.current = next;
            return next;
          });
        } else {
          setState((prev) => {
            const next = { ...prev, hoveredNode: undefined, hoveredNeighbors: undefined };
            stateRef.current = next;
            return next;
          });
        }
        if (renderer) renderer.refresh({ skipIndexation: true });
      }
      function setSelectedNode(node?: string) {
        if (onSelectNode) onSelectNode(node);
        if (node) {
          setState((prev) => {
            const next = { ...prev, selectedNode: node, selectedNeighbors: new Set<string>(graph.neighbors(node)) };
            stateRef.current = next;
            return next;
          });
        } else {
          setState((prev) => {
            const next = { ...prev, selectedNode: undefined, selectedNeighbors: undefined };
            stateRef.current = next;
            return next;
          });
        }
        if (renderer) renderer.refresh({ skipIndexation: true });
      }
      // 노드 클릭 시 검색창에 자동 입력
      renderer.on("downNode", ({ node }: any) => {
        const label = graph.getNodeAttribute(node, "label") ?? node;
        setSearchQuery(label);
        setSelectedNode(node); // 노드 클릭시 경성 노드정보 표시 수정1
      });
      // 검색창에서 해당 노드를 검색하면 그 노드와 이웃만 남기고 블러 처리
      renderer.setSetting("nodeReducer", (node: string, data: any) => {
        const s = stateRef.current;
        const res: any = { ...data };
        // 검색창에서 노드가 선택된 경우(selectedNode), 해당 노드와 이웃만 정상 표시, 나머지는 블러
        if (s.selectedNode && s.selectedNode.length > 0 && s.hoveredNeighbors) {
          if (node !== s.selectedNode && !s.hoveredNeighbors.has(node)) {
            res.label = "";
            res.color = "#f6f6f6";
          }
        } else if (s.suggestions && !s.suggestions.has(node)) {
          // 검색창 입력 중에는 suggestions에 없는 노드만 블러
          res.label = "";
          res.color = "#f6f6f6";
        }
        if (s.selectedNode === node) {
          res.highlighted = true;
        } else if (s.suggestions && s.suggestions.has(node)) {
          res.forceLabel = true;
        }
        return res;
      });
      renderer.setSetting("edgeReducer", (edge: string, data: any) => {
        const s = stateRef.current;
        const res: any = { ...data };
        // 검색창에서 노드가 선택된 경우(selectedNode), 해당 노드와 연결된 엣지만 표시, 나머지는 숨김
        if (s.selectedNode && s.selectedNode.length > 0 && s.hoveredNeighbors) {
          const [source, target] = [graph.source(edge), graph.target(edge)];
          if (
            source !== s.selectedNode &&
            target !== s.selectedNode &&
            !s.hoveredNeighbors.has(source) &&
            !s.hoveredNeighbors.has(target)
          ) {
            res.hidden = true;
          }
        } else if (
          s.suggestions &&
          (!s.suggestions.has(graph.source(edge)) || !s.suggestions.has(graph.target(edge)))
        ) {
          res.hidden = true;
        }
        return res;
      });

      // setSearchQuery를 외부에서 안전하게 참조할 수 있도록 useRef에 미리 할당
      function setSearchQuery(query: string) {
        setState((prev) => {
          const next = { ...prev, searchQuery: query };
          stateRef.current = next;
          return next;
        });
        if (inputRef.current && inputRef.current.value !== query) inputRef.current.value = query;
        if (query) {
          const lcQuery = query.toLowerCase();
          const suggestionsArr = graph
            .nodes()
            .map((n: string) => {
              const label = graph.getNodeAttribute(n, "label");
              return { id: n as string, label: typeof label === "string" ? label : "" };
            })
            .filter(({ label }: { label: string }) => label.toLowerCase().includes(lcQuery));
          const exactMatch = suggestionsArr.find((s: { id: string; label: string }) => s.label === query);
          if (exactMatch) {   // 정확히 일치하는 노드가 있을 때 (대구 검색 시 강대구 현상 해결) 수정3
            setSelectedNode(exactMatch.id);
            if (renderer) {
              const nodePosition = renderer.getNodeDisplayData(exactMatch.id);
              if (nodePosition) renderer.getCamera().animate(nodePosition, { duration: 500 });
            }
          } else if (suggestionsArr.length >= 1) {  // 기존 조건 (너무 엄격함) 수정2
            setSelectedNode(suggestionsArr[0].id);
            // 카메라 이동 (검색에서만)
            if (renderer) {
              const nodePosition = renderer.getNodeDisplayData(suggestionsArr[0].id);
              if (nodePosition) renderer.getCamera().animate(nodePosition, { duration: 500 });
            }
          } else {
            setSelectedNode(undefined);
            setState((prev) => {
              const next = {
                ...prev,
                suggestions: new Set<string>(suggestionsArr.map(({ id }: { id: string }) => id)),
              };
              stateRef.current = next;
              return next;
            });
          }
        } else {
          setSelectedNode(undefined);
          setState((prev) => {
            const next = { ...prev, suggestions: undefined };
            stateRef.current = next;
            return next;
          });
        }
        if (renderer) renderer.refresh({ skipIndexation: true });
      }
      setSearchQueryRef.current = setSearchQuery; // useEffect 내부에서는 할당만

      // 기존 setSearchQuery를 덮어씀
      // 이벤트 바인딩도 새 setSearchQuery로 연결
      if (inputRef.current) {
        inputRef.current.oninput = () => setSearchQuery(inputRef.current!.value || "");
      }
      renderer.on("enterNode", ({ node }: any) => setHoveredNode(node));
      renderer.on("leaveNode", () => setHoveredNode(undefined));
      renderer.setSetting("nodeReducer", (node: string, data: any) => {
        const s = stateRef.current;
        const res: any = { ...data };
        
        // 선택된 노드가 있을 때 우선 적용
        if (s.selectedNode && s.selectedNeighbors) {
          if (node !== s.selectedNode && !s.selectedNeighbors.has(node)) {
            res.label = "";
            res.color = "#666666";  // 흰색 대신 회색으로 변경 (엣지와 구분)
          } else {
            // 선택된 노드와 연결된 노드들은 라벨 강제 표시 및 하이라이트
            res.forceLabel = true;
            res.highlighted = true; // 연결된 노드들도 흰색 배경 표시
          }
          if (s.selectedNode === node) {
            res.highlighted = true;
            res.forceLabel = true;
          }
          return res;
        }
        
        // 선택된 노드가 없을 때만 hover 적용
        if (s.hoveredNode && s.hoveredNeighbors) {
          const nodeType = graph.getNodeAttribute(node, "nodeType");
          
          if (node !== s.hoveredNode && !s.hoveredNeighbors.has(node)) {
            res.label = "";
            res.color = "#666666";  // 회색으로 변경
            
            // 주소 노드는 hover 중에도 라벨 표시 안 함
            if (nodeType === '주소') {
              res.label = "";  // hover 중에는 다른 주소 노드 숨김
            }
          } else {
            res.forceLabel = true;
            res.highlighted = true;  // hover된 노드와 이웃들도 흰색 배경
            
            // 주소 노드 라벨 크기는 hover 상태에서도 유지
            if (nodeType === '주소') {
              res.labelSize = 16;
            }
          }
          
          return res;
        }
        
        // 검색창 입력 중 suggestions
        if (s.suggestions && !s.suggestions.has(node)) {
          res.label = "";
          res.color = "#666666";  // 회색으로 변경
        }
        if (s.suggestions && s.suggestions.has(node)) {
          res.forceLabel = true;
        }
        
        // 주소 노드 라벨 스타일 강화 (모든 상태에서)
        const nodeType = graph.getNodeAttribute(node, "nodeType");
        if (nodeType === '주소') {
          // 아무것도 선택되지 않았을 때만 흰색 배경
          if (!s.selectedNode && !s.hoveredNode && !s.suggestions) {
            res.forceLabel = true;
            res.highlighted = true;  // 흰색 배경 표시
          }
          // 주소 노드는 항상 라벨 크기 증가
          res.labelSize = 16;  // 기본보다 크게
        }
        
        return res;
      });
      renderer.setSetting("edgeReducer", (edge: string, data: any) => {
        const s = stateRef.current;
        const res: any = { ...data };
        
        const [source, target] = [graph.source(edge), graph.target(edge)];
        
        // 선택된 노드가 있을 때 우선 적용 (hover 무시)
        if (s.selectedNode && s.selectedNeighbors) {
          if (
            source !== s.selectedNode &&
            target !== s.selectedNode &&
            !s.selectedNeighbors.has(source) &&
            !s.selectedNeighbors.has(target)
          ) {
            res.hidden = true;
          } else {
            // 선택된 노드와 연결된 엣지는 더 두껍고 흰색으로
            res.size = 5;  // 선택된 엣지 두께 5
            res.color = '#ffffff';  // 흰색
          }
          return res;
        }
        
        // 선택된 노드가 없을 때만 hover 적용
        if (s.hoveredNode && s.hoveredNeighbors) {
          if (
            source !== s.hoveredNode &&
            target !== s.hoveredNode &&
            !s.hoveredNeighbors.has(source) &&
            !s.hoveredNeighbors.has(target)
          ) {
            res.hidden = true;
          } else {
            // 호버된 노드의 엣지도 두껍고 흰색으로
            res.size = 4;  // 호버 엣지 두께 4
            res.color = '#ffffff';  // 흰색
          }
          return res;
        }
        
        // 검색창 입력 중 suggestions
        if (
          s.suggestions &&
          (!s.suggestions.has(source) || !s.suggestions.has(target))
        ) {
          res.hidden = true;
        }
        return res;
      });
      // cleanup
      return () => {
        if (renderer) {
          renderer.kill();
          rendererRef.current = null;
        }
      };
    });
    return () => {
      if (renderer) {
        renderer.kill();
        rendererRef.current = null;
      }
    };
  }, [graphData]);

  // selectedNode가 변경될 때 그래프에서 해당 노드 자동 선택 또는 초기화
  useEffect(() => {
    // graphData가 없거나 renderer가 없으면 실행하지 않음
    if (!graphData || !rendererRef.current || !setSearchQueryRef.current) return;
    
    if (selectedNode) {
      // 검색창에 노드 이름 설정하여 자동 선택 효과
      const nodeLabel = graphData.nodes?.find((n: any) => (n.key || n.id) === selectedNode)?.attributes?.label;
      if (nodeLabel) {
        setSearchQueryRef.current(nodeLabel);
      }
      
      // 즉시 그래프 렌더링 업데이트
      setTimeout(() => {
        if (rendererRef.current) {
          rendererRef.current.refresh();
        }
      }, 10);
    } else {
      // selectedNode가 undefined가 되면 검색창을 비워서 그래프 초기화
      setSearchQueryRef.current("");
      
      // 즉시 그래프 렌더링 업데이트
      setTimeout(() => {
        if (rendererRef.current) {
          rendererRef.current.refresh();
        }
      }, 10);
    }
  }, [selectedNode, graphData]);

  // inputRef를 외부에서 제어할 수 있게 연결
  useEffect(() => {
    if (searchInputRef && searchInputRef.current !== inputRef.current) {
      // 외부에서 ref를 전달받으면 내부 inputRef와 동기화
      (searchInputRef as any).current = inputRef.current;
    }
  }, [searchInputRef]);

  // 검색창 포커스/블러/X버튼 처리
  useEffect(() => {
    if (!setSearchActive) return;
    const input = inputRef.current;
    if (!input) return;
    const handleFocus = () => setSearchActive(true);
    // blur에서는 더 이상 setSearchActive(false) 호출하지 않음
    input.addEventListener('focus', handleFocus);
    return () => {
      input.removeEventListener('focus', handleFocus);
    };
  }, [setSearchActive]);

  return (
    <div className="flex flex-col w-full h-full min-h-screen bg-black">
      <div className="flex items-center gap-2 p-4 justify-end">
        <div className="relative w-64">
          <input
            ref={inputRef}
            id="search-input"
            className="border rounded px-3 py-2 w-full pr-8 bg-neutral-900 text-white placeholder-gray-300 focus:bg-neutral-800 focus:border-blue-400 transition-colors duration-150"
            placeholder="노드 이름 검색"
            list="suggestions"
            value={state.searchQuery}
            onChange={e => setSearchQueryRef.current(e.target.value)}
            onFocus={() => {
              setDropdownOpen && setDropdownOpen(true);
              setSearchActive && setSearchActive(true);
            }}
            onBlur={() => {
              setDropdownOpen && setDropdownOpen(false);
            }}
          />
          {/* 드롭다운 방향 아이콘 */}
          <span className="absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer select-none">
            {dropdownOpen ? (
              <ChevronDown style={{ transform: 'rotate(180deg)' }} className="w-4 h-4 text-white transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white transition-transform" />
            )}
          </span>
          {state.searchQuery && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-gray-200"
              aria-label="검색어 지우기"
              onClick={() => {
                setSearchQueryRef.current("");
                if (setSearchActive) setSearchActive(false);
              }}
              style={{ padding: 0, background: 'none', border: 'none' }}
            >
              <Image src="/images/icon-x.svg" alt="지우기" width={20} height={20} />
            </button>
          )}
          <datalist id="suggestions" ref={datalistRef} />
        </div>
        
        {/* 선택 해제 버튼 */}
        {selectedNode && onClearSelection && (
          <div className="flex justify-center mt-3 mb-2">
            <button
              onClick={onClearSelection}
              className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all shadow-lg hover:shadow-xl"
            >
              선택 해제
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 w-full h-[calc(100vh-5rem)] min-h-[500px]">
        <div className="relative w-full h-full min-h-[500px]">
          <div ref={containerRef} className="absolute inset-0 z-0 w-full h-full min-h-[500px] pointer-events-auto" />
        </div>
      </div>

      
      {/* 드롭다운 input의 기본 화살표(▼)를 숨기는 CSS */}
      <style jsx global>{`
        input[list]::-webkit-calendar-picker-indicator {
          opacity: 0;
          display: none;
        }
        input[list]::-webkit-input-placeholder {
          color: inherit;
        }
        input[list]::-ms-expand {
          display: none;
        }
        input[list] {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background: none;
        }
      `}</style>
    </div>
  );
}
