"use client";
import Header from "../../components/header";
import KnowledgeGraph from "../../components/knowledgegraph";
import Footer from "../../components/footer";

export default function GraphPage() {
  return (
    <div className="flex flex-col h-screen m-0 p-0">
      {/* Header */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* 관계도 탐색 화면 + 노드 설명 - 한 화면에 맞춤 */}
      <main className="flex flex-col bg-black" style={{ height: 'calc(100vh - 80px)' }}>
        {/* 그래프 영역 - 높이 제한 */}
        <div className="overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <KnowledgeGraph />
        </div>

        {/* 노드 설명 섹션 - 고정 높이 */}
        <section className="bg-black text-white py-4 px-6 border-t border-gray-700 h-[120px]">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-xl font-bold mb-4">노드 타입 안내</h3>
            <div className="grid grid-cols-5 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FFA500] flex-shrink-0"></div>
                <span className="text-sm">주소 노드</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#FFFF00] flex-shrink-0"></div>
                <span className="text-sm">연도 노드</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#87CEEB] flex-shrink-0"></div>
                <span className="text-sm">인물 노드</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#00FF00] flex-shrink-0"></div>
                <span className="text-sm">사건 노드</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#800080] flex-shrink-0"></div>
                <span className="text-sm">죄명 노드</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - 스크롤 시 보임 */}
      <div className="flex-shrink-0">
        <Footer />
      </div>
    </div>
  );
}




