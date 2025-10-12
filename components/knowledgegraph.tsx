"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronRight, X, Clock, ChevronDown, Bookmark } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { LoadingCard, LoadingSpinner } from "@/components/ui/loading"
import { ErrorCard, ErrorMessage } from "@/components/ui/error"
import GraphComponent from "@/components/graph"

export default function KnowledgeGraph() {
  const [activeTab, setActiveTab] = useState<string>("설명사이드바")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | undefined>(undefined)
  const [graphData, setGraphData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 데이터셋 버튼 핸들러 (각 버튼마다 파일명 코드에서 지정)
  const [activeDataset, setActiveDataset] = useState('전체.json');
  const datasetFiles = [
    { name: '전체', file: '전체.json' },
    { name: '함경도(Hamgyeongdo)', file: '함경도.json' }, // 여기에 원하는 파일명 입력
    { name: '평안도(Pyongan)', file: '평안도.json' }, // 여기에 원하는 파일명 입력
    { name: '황해도(Hwanghae)', file: '황해도.json' },
    { name: '강원도(Gangwon)', file: '강원도.json' }, // 여기에 원하는 파일명 입력
    { name: '경기도(Gyeonggi)', file: '경기도.json' },
    { name: '충청도(Chungcheong)', file: '충청도.json' }, // 여기에 원하는 파일명 입력
    { name: '전라도(Jeolla)', file: '전라도.json' },
    { name: '경상도(Gyeongsang)', file: '경상도.json' }, // 여기에 원하는 파일명 입력
    { name: '기타(Other)', file: '기타.json' }
  ];

  // 노드 선택 드롭다운 상태 - 단일 선택
  const [availableNodes, setAvailableNodes] = useState<Array<{id: string, label: string, type: string}>>([]);
  const [currentSelection, setCurrentSelection] = useState<{type: string, id: string, label: string} | null>(null);
  

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      // 데이터셋 변경 시 모든 선택 상태 초기화
      setSelectedNode(undefined);
      setCurrentSelection(null);
      setSidebarOpen(false);
      
      try {
        const response = await fetch(`/data/${activeDataset}`);
        if (!response.ok) {
          throw new Error(`데이터를 불러올 수 없습니다: ${response.status}`);
        }
        const json = await response.json();
        
        // 로딩 상태를 더 잘 보여주기 위해 최소 1초 지연
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setGraphData(json);
        
        // 사용 가능한 노드들 추출
        const nodes = json.nodes?.map((node: any) => ({
          id: node.key || node.id,
          label: node.attributes?.label || node.label || node.key || node.id,
          type: node.attributes?.type || '기타'
        })) || [];
        setAvailableNodes(nodes);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다';
        setError(errorMessage);
        console.error('Data loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeDataset]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // 선택된 노드와 직접 연결된 노드들만 가져오기 (1단계만)
  const getDirectlyConnectedNodes = (nodeId: string): Set<string> => {
    const connected = new Set<string>();
    if (!graphData || !graphData.edges) return connected;
    
    graphData.edges.forEach((edge: any) => {
      if (edge.source === nodeId) {
        connected.add(edge.target);
      }
      if (edge.target === nodeId) {
        connected.add(edge.source);
      }
    });
    
    return connected;
  };

  // 노드 타입별로 그룹화 (필터링 적용)
  const getNodesByType = (type: string) => {
    return availableNodes.filter(node => node.type === type);
  };

  // 선택된 노드와 직접 연결된 노드들만 가져오기
  const getFilteredNodesByType = (type: string) => {
    let filteredNodes = availableNodes.filter(n => n.type === type);
    
    // 선택된 노드가 없으면 모든 노드 반환
    if (!currentSelection) {
      return filteredNodes;
    }
    
    // 선택된 노드와 직접 연결된 노드들
    const connectedNodeIds = getDirectlyConnectedNodes(currentSelection.id);
    
    // 해당 타입이면서 연결된 노드들만 필터링
    filteredNodes = filteredNodes.filter(node => {
      // 이미 선택된 노드면 포함
      if (node.id === currentSelection.id) {
        return true;
      }
      // 직접 연결된 노드만 포함
      return connectedNodeIds.has(node.id);
    });
    
    return filteredNodes;
  };

  // 드롭다운에서 노드 선택 시 처리 (단일 선택)
  const handleNodeSelect = (type: string, nodeId: string, label: string) => {
    if (!nodeId) {
      // 빈 값 선택 시 선택 해제
      setCurrentSelection(null);
      setSelectedNode(undefined);
      return;
    }
    
    // 새로운 노드 선택 (이전 선택 자동 초기화)
    setCurrentSelection({ type, id: nodeId, label });
    setSelectedNode(nodeId);
    setSidebarOpen(true);
  };

  // 마우스 클릭으로 노드 선택 시 드롭다운 동기화
  const handleNodeSelectFromGraph = (nodeId: string | undefined) => {
    if (!nodeId) return;
    
    setSelectedNode(nodeId);
    setSidebarOpen(true);
    
    // 선택된 노드의 타입 찾기
    const selectedNodeData = availableNodes.find(node => node.id === nodeId);
    if (selectedNodeData) {
      // 새로운 노드로 교체
      setCurrentSelection({
        type: selectedNodeData.type,
        id: nodeId,
        label: selectedNodeData.label
      });
    }
  };

  // 초기화 함수
  const handleReset = () => {
    setSelectedNode(undefined);
    setCurrentSelection(null);
    
    // 검색창도 초기화
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  // 노드 선택 해제 함수
  const handleClearSelection = () => {
    setSelectedNode(undefined);
    setCurrentSelection(null);
    
    // 검색창 초기화는 graph.tsx의 useEffect에서 자동으로 처리됨
  };

  // 노드 및 이웃 정보 추출 (단일 선택)
  let nodeInfo: any = null
  let neighborInfos: any[] = []
  
  if (graphData && selectedNode) {
    const nodeMap = new Map(
      graphData.nodes.map((n: any) => [n.key, n.attributes])
    )
    
    nodeInfo = nodeMap.get(selectedNode)
    
    // 선택된 노드와 직접 연결된 이웃 찾기 (양방향)
    const neighbors = getDirectlyConnectedNodes(selectedNode);
    
    neighborInfos = Array.from(neighbors)
      .map((k) => nodeMap.get(k))
      .filter(Boolean);
  }

  // 주요 label 매핑
  const LABEL_MAP: Record<string, string> = {
    '주소': '주소',
    '연도': '년도',
    '이름': '이름',
    '죄명': '죄명',
    '사건': '사건개요',
    '사건개요': '사건개요',
    '개요' : '개요',
    'label': '이름',
    'type': '유형',
    '나이': '나이',
    '주문': '주문',
    '본주거지': '주소',
    '판결시점': '판결시점',
  };
  // 고정 라벨 순서 및 키 매핑
  const FIXED_LABELS = [
    { label: '주소', keys: ['주소', '본주거지'] },
    { label: '판결시점', keys: ['판결시점'] }, // 판결시점으로 수정
    { label: '이름', keys: ['이름', 'label'] },
    { label: '주문', keys: ['주문'] }, 
    { label: 'URI', keys: ['uri'] },  // 사건개요 URI로 수정 수정4
  ];

  function extractMainInfo(attr: any) {
    if (!attr) return [];
    const result: { label: string; value: string }[] = [];
    // 주소
    if (attr.type === '주소' || attr['본주거지']) {
      result.push({ label: '주소', value: attr['label'] || attr['본주거지'] || '' });
    }
    // 년도
    if (attr.type === '연도' || /^year_/.test(attr['label'])) {
      result.push({ label: '년도', value: attr['label'] });
    }
    // 이름(인물)
    if (attr.type === '인물' || attr['label']) {
      result.push({ label: '이름', value: attr['label'] });
    }
    // 죄명
    if (attr.type === '죄명' || attr['type'] === '죄명' || attr['label']?.includes('죄')) {
      result.push({ label: '죄명', value: attr['label'] });
    }
    // 기타 주요 속성
    ['나이', '주문', '판결시점'].forEach((k) => {
      if (attr[k]) result.push({ label: LABEL_MAP[k] || k, value: attr[k] });
    });
    // 중복 제거
    const seen = new Set();
    return result.filter(({ label, value }) => {
      const key = label + value;
      if (seen.has(key) || !value) return false;
      seen.add(key);
      return true;
    });
  }

  function renderMainInfo(mainInfo: any[]) {
    if (!mainInfo || mainInfo.length === 0) {
      return <div className="text-gray-400">주요 정보 없음</div>;
    }
    return mainInfo.map((item, i) => (
      <div key={i} className="flex justify-between text-black">
        <span className="font-medium text-black">{item.label}</span>
        <span className="ml-2 text-black">{item.value}</span>
      </div>
    ));
  }
  function renderFixedInfo(attr: any) {
    if (!attr) return null;
    return (
      <div className="space-y-1">
        {FIXED_LABELS.map(({ label, keys }) => {
          const value = keys.map(k => attr[k]).find(v => !!v);
          return (
            <div key={label} className="flex justify-between text-black">
              <span className="font-medium">{label}</span>
              <span className="ml-2">
                {label === 'URI' && value ? (   // URI a태그 달았음 수정5
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all"
                  >
                    {value}
                  </a>
                ) : (
                  value || <span className="text-gray-400">정보 없음</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  // 관계 정보(이웃 노드)에서 이름만 보이게 렌더링
  function renderNeighborInfo(neighborInfos: any[]) {
    if (!neighborInfos || neighborInfos.length === 0) return null;
    return (
      <div className="p-4 border-b">
        <h2 className="text-lg text-black font-bold mb-2">관계 정보</h2>
        {neighborInfos.map((info, idx) => {
          let name = "이름 없음";
          const type = info?.type || info?.attributes?.type;
          if (type === '사건') {
            name = info['개요'] || info['사건개요'] ||
                   (info.attributes && (info.attributes['개요'] || info.attributes['사건개요'])) ||
                   info['label'] || info['이름'] || info['name'] ||
                   (info.attributes && (info.attributes['label'] || info.attributes['이름'] || info.attributes['name'])) ||
                   "이름 없음";
          } else {
            name = info['label'] || info['이름'] || info['name'] ||
                   (info.attributes && (info.attributes['label'] || info.attributes['이름'] || info.attributes['name'])) ||
                   "이름 없음";
          }
          return (
            <div key={idx} className="mb-2 p-2 bg-gray-100 rounded flex justify-between text-xs text-black">
              <span className="font-medium text-black">node</span>
              <span className="ml-2 text-black">{name}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // 노드 정보 렌더링
  let nodeInfoBlock = null;
  useEffect(() => {
    // 노드가 선택되면 사이드바 자동 오픈
    if (selectedNode) setSidebarOpen(true);
  }, [selectedNode]);
  if (nodeInfo) {
    const mainInfo = extractMainInfo(nodeInfo);
    nodeInfoBlock = (
      <div className="mt-2 mb-4 text-sm space-y-1">
        {renderMainInfo(mainInfo)}
      </div>
    );
  }

  const sidebarRef = useRef<HTMLDivElement>(null);

  // 검색창 관련 상태
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchActive, setSearchActive] = useState(false);

  // 배경 클릭 시 선택 해제 기능 제거 - 선택 해제 버튼으로만 해제 가능

  // 검색창 포커스/블러/X버튼 처리
  // GraphComponent에 searchInputRef, setSearchActive prop 전달 필요

  // 드롭다운 방향 상태
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 데이터 재로딩 함수
  const handleRetry = () => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/data/${activeDataset}`);
        if (!response.ok) {
          throw new Error(`데이터를 불러올 수 없습니다: ${response.status}`);
        }
        const json = await response.json();
        
        // 로딩 상태를 더 잘 보여주기 위해 최소 1초 지연
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setGraphData(json);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '데이터 로딩 중 오류가 발생했습니다';
        setError(errorMessage);
        console.error('Data loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  };

  return (
    <div className="flex w-full h-full bg-gray-100">
      <div className="flex flex-col flex-1 h-full">
        <div className="flex-1 relative overflow-hidden h-full">
          <div className="w-full h-full relative bg-gray-100">
            {/* Floating Buttons (상단 좌측) */}
            <div
              className={`absolute top-4 z-10 flex space-x-2 transition-all duration-300 ${
                sidebarOpen ? "left-[370px]" : "left-4"
              }`}
            >
              {datasetFiles.map((btn, idx) => (
                <Button
                  key={btn.name + idx}
                  variant={activeDataset === btn.file ? "default" : "secondary"}
                  size="sm"
                  className={`bg-white text-black shadow-md border ${activeDataset === btn.file ? 'border-blue-500 font-bold' : 'border-gray-200'}`}
                  onClick={() => setActiveDataset(btn.file)}
                  disabled={isLoading}
                >
                  {isLoading && activeDataset === btn.file ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : null}
                  {btn.name}
                </Button>
              ))}
            </div>

            {/* 메인 콘텐츠 */}
            <div className="w-full h-full bg-black">
              {isLoading ? (
                <div className="flex items-center justify-center h-full bg-black">
                  <LoadingCard message="데이터를 불러오는 중..." />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full bg-black">
                  <ErrorCard
                    title="데이터 로딩 실패"
                    message={error}
                    onRetry={handleRetry}
                  />
                </div>
              ) : (
                <GraphComponent 
                  onSelectNode={handleNodeSelectFromGraph} 
                  selectedFile={activeDataset}
                  searchInputRef={searchInputRef}
                  setSearchActive={setSearchActive}
                  dropdownOpen={dropdownOpen}
                  setDropdownOpen={setDropdownOpen}
                  selectedNode={selectedNode}
                  onClearSelection={handleClearSelection}
                />
              )}
            </div>
          </div>

          {/* 사이드바 */}
          <div
            ref={sidebarRef}
            className={`absolute top-0 left-0 h-full w-[350px] bg-gray-200 border-r overflow-y-auto transition-transform duration-300 z-30 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* 노드 선택 드롭다운 섹션 */}
            <div className="p-4 border-b bg-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg text-black font-bold">노드 탐색</h2>
                <button
                  onClick={handleReset}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  초기화
                </button>
              </div>
              
              {/* 노드 타입별 드롭다운 */}
              {['주소', '연도', '인물', '사건', '죄명'].map(type => {
                const filteredNodes = getFilteredNodesByType(type);
                const totalNodes = getNodesByType(type).length;
                
                if (totalNodes === 0) return null;
                
                return (
                  <div key={type} className="mb-3">
                    <label className="block text-sm font-medium text-black mb-1">
                      {type} {filteredNodes.length < totalNodes ? (
                        <span>
                          (<span className="text-blue-600">{filteredNodes.length}</span>/{totalNodes}개)
                        </span>
                      ) : (
                        <span>({totalNodes}개)</span>
                      )}
                    </label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-black"
                      value={currentSelection?.type === type ? currentSelection.id : ""}
                      onChange={(e) => {
                        const nodeId = e.target.value;
                        const node = filteredNodes.find(n => n.id === nodeId);
                        if (node) {
                          handleNodeSelect(type, nodeId, node.label);
                        } else {
                          handleNodeSelect(type, "", "");
                        }
                      }}
                    >
                      <option value="">{type} 선택...</option>
                      {filteredNodes.map(node => (
                        <option key={node.id} value={node.id}>
                          {node.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-b">
              {/* 선택된 노드 표시 */}
              {currentSelection && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h2 className="text-sm font-bold text-blue-900 mb-2">
                    선택된 노드
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                      {currentSelection.type}: {currentSelection.label}
                    </span>
                  </div>
                </div>
              )}
              
              <h1 className="text-xl text-black font-bold">노드 정보</h1>
              
              {/* 노드 정보 표시 */}
              {selectedNode && selectedNode.startsWith('e') && nodeInfo && nodeInfo['개요'] ? (
                <div className="text-black whitespace-pre-line">{nodeInfo['개요']}</div>
              ) : (
                renderFixedInfo(nodeInfo)
              )}
            </div>
            {neighborInfos.length > 0 && renderNeighborInfo(neighborInfos)}

            {/* 설명 섹션 */}
            <div className="p-4 border-b">
              
              {/* 탭 */}
              <div className="flex justify-between mb-4">
                <div
                  className={`font-medium cursor-pointer ${
                    activeTab === "주변" ? "text-black" : "text-gray-400"
                  }`}
                  onClick={() => setActiveTab("주변")}
                >
                  사진 없음
                </div>
              </div>

              {/* 이미지 아이템 */}
              
            </div>
          </div>

          {/* 사이드바 토글 버튼 */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 z-40 transition-transform duration-300 ${
              sidebarOpen ? "left-[350px]" : "left-0"
            }`}
          >
            <button
              onClick={toggleSidebar}
              className="bg-gray-200 h-16 w-6 flex items-center justify-center rounded-r-lg shadow-md border-t border-r border-b border-gray-200"
            >
              <ChevronRight
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  sidebarOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
