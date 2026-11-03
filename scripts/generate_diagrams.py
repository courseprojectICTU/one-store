import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, ArrowStyle

os.makedirs('docs/images', exist_ok=True)

# Set high DPI and font
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

def create_architecture_diagram():
    fig, ax = plt.subplots(figsize=(14, 8.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    
    # Background
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')
    
    # Title
    ax.text(50, 96, "KIẾN TRÚC TỔNG THỂ HỆ THỐNG CHATBOT AI DOANH NGHIỆP (RAG)", 
            fontsize=16, fontweight='bold', ha='center', va='center', color='#0f172a')
    ax.text(50, 92.5, "Phân tách rõ ràng 2 luồng: Nạp tri thức (Offline Indexing) & Truy xuất - Sinh câu trả lời (Online RAG)", 
            fontsize=11, fontstyle='italic', ha='center', va='center', color='#475569')

    # Draw Boxes for 6 Components
    # 1. User & UI Widget
    ui_box = FancyBboxPatch((4, 52), 16, 26, boxstyle="round,pad=1.2", 
                            edgecolor="#0f172a", facecolor="#f8fafc", linewidth=1.5)
    ax.add_patch(ui_box)
    ax.text(12, 75, "1. GIAO DIỆN (UI)", fontsize=11, fontweight='bold', ha='center', color='#0f172a')
    ax.text(12, 71, "Chatbot Widget", fontsize=10, fontweight='bold', ha='center', color='#2563eb')
    ax.text(12, 64, "• Floating Bubble\n• Lịch sử tin nhắn\n• Trạng thái typing\n• Hiển thị Sources\n• Reset hội thoại", 
            fontsize=8.5, ha='center', color='#334155', linespacing=1.4)
    
    # User Icon Representation
    user_box = FancyBboxPatch((4, 20), 16, 18, boxstyle="round,pad=1.2", 
                              edgecolor="#64748b", facecolor="#ffffff", linewidth=1.2, linestyle='--')
    ax.add_patch(user_box)
    ax.text(12, 33, "NGƯỜI DÙNG", fontsize=11, fontweight='bold', ha='center', color='#0f172a')
    ax.text(12, 26, "Khách hàng truy cập\n(Đặt câu hỏi & nhận\ncâu trả lời minh bạch)", 
            fontsize=8.5, ha='center', color='#475569', linespacing=1.3)

    # 2. Backend API Gateway
    api_box = FancyBboxPatch((27, 44), 18, 38, boxstyle="round,pad=1.2", 
                             edgecolor="#0f172a", facecolor="#f8fafc", linewidth=1.5)
    ax.add_patch(api_box)
    ax.text(36, 78, "2. CỔNG ĐIỀU PHỐI", fontsize=11, fontweight='bold', ha='center', color='#0f172a')
    ax.text(36, 74, "Backend API Gateway", fontsize=10, fontweight='bold', ha='center', color='#2563eb')
    ax.text(36, 60, "• Route: POST /api/chat\n• Kiểm duyệt & Guardrails\n• Điều phối luồng RAG\n• Nạp bối cảnh Prompt\n• Quản lý lịch sử hội thoại\n• Định dạng phản hồi JSON\n• Fallback chống lỗi mạng", 
            fontsize=8.5, ha='center', color='#334155', linespacing=1.4)

    # 3. Embedding Model
    emb_box = FancyBboxPatch((52, 66), 18, 18, boxstyle="round,pad=1.2", 
                             edgecolor="#0f172a", facecolor="#f8fafc", linewidth=1.5)
    ax.add_patch(emb_box)
    ax.text(61, 80, "4. MÔ HÌNH NHÚNG", fontsize=11, fontweight='bold', ha='center', color='#0f172a')
    ax.text(61, 76, "Embedding Model", fontsize=10, fontweight='bold', ha='center', color='#059669')
    ax.text(61, 70, "Biến văn bản thành vector\ntoán học đa chiều (1024d)\n(VD: BGE-M3, Text-Embed)", 
            fontsize=8.5, ha='center', color='#334155', linespacing=1.3)

    # 4. Vector Database
    vec_box = FancyBboxPatch((77, 66), 18, 18, boxstyle="round,pad=1.2", 
                             edgecolor="#0f172a", facecolor="#f8fafc", linewidth=1.5)
    ax.add_patch(vec_box)
    ax.text(86, 80, "5. VECTOR DATABASE", fontsize=11, fontweight='bold', ha='center', color='#0f172a')
    ax.text(86, 76, "Cơ sở dữ liệu Vector", fontsize=10, fontweight='bold', ha='center', color='#059669')
    ax.text(86, 70, "Lưu mảng số vector & quét\nCosine Similarity Top-K\n(Vectorize, Pinecone, Qdrant)", 
            fontsize=8.5, ha='center', color='#334155', linespacing=1.3)

    # 5. Knowledge Base (Raw SQL Data)
    kb_box = FancyBboxPatch((77, 34), 18, 22, boxstyle="round,pad=1.2", 
                            edgecolor="#0f172a", facecolor="#f8fafc", linewidth=1.5)
    ax.add_patch(kb_box)
    ax.text(86, 52, "3. KHO DỮ LIỆU GỐC", fontsize=11, fontweight='bold', ha='center', color='#0f172a')
    ax.text(86, 48, "Knowledge Base (SQL)", fontsize=10, fontweight='bold', ha='center', color='#d97706')
    ax.text(86, 41, "Lưu toàn văn chính sách,\nsản phẩm, giá bán & Metadata\n(SQLite D1, Postgres)", 
            fontsize=8.5, ha='center', color='#334155', linespacing=1.3)

    # 6. LLM
    llm_box = FancyBboxPatch((52, 22), 18, 24, boxstyle="round,pad=1.2", 
                             edgecolor="#0f172a", facecolor="#f8fafc", linewidth=1.5)
    ax.add_patch(llm_box)
    ax.text(61, 42, "6. MÔ HÌNH NGÔN NGỮ", fontsize=11, fontweight='bold', ha='center', color='#0f172a')
    ax.text(61, 38, "Large Language Model (LLM)", fontsize=9.5, fontweight='bold', ha='center', color='#7c3aed')
    ax.text(61, 29, "Đọc Prompt: [System Instruction]\n+ [Context Tri thức trích dẫn]\n+ [Câu hỏi khách hàng]\n=> Suy luận & sinh câu trả lời", 
            fontsize=8.5, ha='center', color='#334155', linespacing=1.3)

    # Offline Indexing Box (Top boundary)
    idx_zone = FancyBboxPatch((50, 62), 47, 26, boxstyle="round,pad=0.8",
                              edgecolor="#059669", facecolor="none", linewidth=1.2, linestyle=':')
    ax.add_patch(idx_zone)
    ax.text(73.5, 63.2, "[ LUỒNG 1: OFFLINE INDEXING - NẠP & VECTOR HÓA DỮ LIỆU ]", 
            fontsize=8.5, fontweight='bold', ha='center', color='#059669', backgroundcolor='#ffffff')

    # Draw Arrows & Dataflow
    # User <-> UI
    ax.annotate('', xy=(12, 52), xytext=(12, 38),
                arrowprops=dict(arrowstyle="<->", color="#0f172a", lw=2))
    ax.text(13.5, 45, "(1) Hỏi & (10) Trả lời", fontsize=8, color="#0f172a", fontweight='bold')

    # UI -> API Gateway
    ax.annotate('', xy=(27, 65), xytext=(20, 65),
                arrowprops=dict(arrowstyle="->", color="#2563eb", lw=2))
    ax.text(23.5, 67, "(2) POST", fontsize=8, color="#2563eb", fontweight='bold', ha='center')

    # API Gateway -> UI
    ax.annotate('', xy=(20, 59), xytext=(27, 59),
                arrowprops=dict(arrowstyle="->", color="#2563eb", lw=2))
    ax.text(23.5, 56, "(9) JSON", fontsize=8, color="#2563eb", fontweight='bold', ha='center')

    # API Gateway -> Embedding
    ax.annotate('', xy=(52, 75), xytext=(45, 75),
                arrowprops=dict(arrowstyle="->", color="#2563eb", lw=1.8))
    ax.text(48.5, 77, "(3) Embed\nquery", fontsize=7.5, color="#2563eb", fontweight='bold', ha='center')

    # Embedding -> Vector DB
    ax.annotate('', xy=(77, 75), xytext=(70, 75),
                arrowprops=dict(arrowstyle="->", color="#2563eb", lw=1.8))
    ax.text(73.5, 77, "(4) Query\nVector", fontsize=7.5, color="#2563eb", fontweight='bold', ha='center')

    # Vector DB -> Knowledge Base (Fetch chunks)
    ax.annotate('', xy=(86, 56), xytext=(86, 66),
                arrowprops=dict(arrowstyle="->", color="#2563eb", lw=1.8))
    ax.text(88, 61, "(5) Top-K IDs", fontsize=8, color="#2563eb", fontweight='bold')

    # Knowledge Base -> Backend (Snippets text)
    ax.annotate('', xy=(45, 53), xytext=(77, 45),
                arrowprops=dict(arrowstyle="->", color="#2563eb", lw=1.8, connectionstyle="arc3,rad=-0.1"))
    ax.text(63, 50, "(6) Lấy văn bản gốc theo Chunk IDs", fontsize=8, color="#2563eb", fontweight='bold', ha='center')

    # Backend -> LLM
    ax.annotate('', xy=(52, 34), xytext=(45, 46),
                arrowprops=dict(arrowstyle="->", color="#7c3aed", lw=2, connectionstyle="arc3,rad=0.1"))
    ax.text(47, 38, "(7) Ghép Context\nPrompt", fontsize=8, color="#7c3aed", fontweight='bold', ha='right')

    # LLM -> Backend
    ax.annotate('', xy=(45, 49), xytext=(52, 38),
                arrowprops=dict(arrowstyle="->", color="#7c3aed", lw=2, connectionstyle="arc3,rad=-0.1"))
    ax.text(50.5, 44, "(8) Answer\n+ Sources", fontsize=8, color="#7c3aed", fontweight='bold', ha='left')

    # Offline Indexing arrow (KB -> Emb -> Vec)
    ax.annotate('', xy=(61, 84), xytext=(86, 56),
                arrowprops=dict(arrowstyle="->", color="#059669", lw=1.5, linestyle="--", connectionstyle="arc3,rad=0.35"))
    ax.text(77, 90, "(A) Chunks văn bản", fontsize=8, color="#059669", fontweight='bold', ha='center')

    ax.annotate('', xy=(86, 84), xytext=(61, 84),
                arrowprops=dict(arrowstyle="->", color="#059669", lw=1.5, linestyle="--", connectionstyle="arc3,rad=-0.15"))
    ax.text(73.5, 86.5, "(B) Upsert Vectors", fontsize=8, color="#059669", fontweight='bold', ha='center')

    # Legend at bottom
    leg_box = FancyBboxPatch((4, 4), 92, 13, boxstyle="round,pad=0.8", 
                             edgecolor="#cbd5e1", facecolor="#f8fafc", linewidth=1)
    ax.add_patch(leg_box)
    ax.text(6, 13.5, "CHÚ GIẢI LUỒNG DỮ LIỆU & NGUYÊN TẮC HOẠT ĐỘNG:", fontsize=9.5, fontweight='bold', color='#0f172a')
    ax.text(6, 9.5, "• Nét đứt màu xanh lá (A -> B): Luồng Offline Indexing chuẩn bị tri thức, băm nhỏ văn bản (Smart Chunking), vector hóa và nạp vào Vector DB.", 
            fontsize=8.5, color='#059669')
    ax.text(6, 6.5, "• Nét liền màu xanh dương & tím (1 -> 10): Luồng Online RAG thời gian thực khi khách hàng đặt câu hỏi, truy xuất Top-K ngữ cảnh và LLM suy luận.", 
            fontsize=8.5, color='#1e40af')
    ax.text(6, 4.0, "* Lưu ý kỹ thuật: RAG không loại bỏ hoàn toàn ảo giác (hallucination) 100%, mà giảm thiểu tối đa rủi ro bằng cách neo câu trả lời vào nguồn dữ liệu xác thực.", 
            fontsize=8, fontstyle='italic', color='#64748b')

    plt.tight_layout()
    plt.savefig('docs/images/architecture_diagram.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("architecture_diagram.png created.")

def create_workflow_diagram():
    fig, ax = plt.subplots(figsize=(14, 5.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    
    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    ax.text(50, 94, "QUY TRÌNH 4 BƯỚC TRIỂN KHAI HỆ THỐNG CHATBOT AI RAG", 
            fontsize=15, fontweight='bold', ha='center', color='#0f172a')
    ax.text(50, 88, "Quy chuẩn mẫu (Template) chuẩn hóa ứng dụng cho mọi hệ thống doanh nghiệp", 
            fontsize=10.5, fontstyle='italic', ha='center', color='#475569')

    steps = [
        {
            "num": "BƯỚC 1",
            "title": "CHUẨN BỊ TRI THỨC\n& CHUNKING",
            "color": "#0284c7",
            "input": "• Docs/Policies thô\n• Danh mục sản phẩm\n• FAQ/Chính sách bán",
            "process": "• Làm sạch văn bản\n• Cắt đoạn 500-1100 ký tự\n• Thiết lập Overlap 10-15%",
            "output": "• Mảng Chunks văn bản\n• Metadata phân loại",
            "x": 3
        },
        {
            "num": "BƯỚC 2",
            "title": "VECTOR HÓA &\nNẠP DỮ LIỆU",
            "color": "#059669",
            "input": "• Chunks văn bản\n• Metadata & ID",
            "process": "• Gọi Embedding Model\n• Sinh vector đa chiều\n• Upsert Vector DB & SQL",
            "output": "• Vector DB sẵn sàng\n• Bảng ánh xạ Chunk SQL",
            "x": 27.5
        },
        {
            "num": "BƯỚC 3",
            "title": "XÂY DỰNG PIPELINE\nRAG BACKEND",
            "color": "#7c3aed",
            "input": "• Câu hỏi người dùng\n• Tham số Top-K",
            "process": "• Embed câu hỏi\n• Quét Cosine Similarity\n• Lấy text gốc & ráp Prompt\n• LLM suy luận & bóc tách",
            "output": "• Endpoint POST /api/chat\n• JSON: answer + sources",
            "x": 52
        },
        {
            "num": "BƯỚC 4",
            "title": "TÍCH HỢP GIAO DIỆN\n& KIỂM THỬ",
            "color": "#ea580c",
            "input": "• Backend API\n• Giao diện Web/App",
            "process": "• Tạo Chat Widget nổi\n• Auto-scroll, Typing status\n• Hiển thị trích dẫn nguồn\n• Kiểm thử 3 kịch bản",
            "output": "• Chatbot hoạt động 100%\n• Báo cáo kiểm thử nghiệm thu",
            "x": 76.5
        }
    ]

    for i, s in enumerate(steps):
        x = s["x"]
        # Step card
        card = FancyBboxPatch((x, 6), 20.5, 76, boxstyle="round,pad=1.0", 
                              edgecolor=s["color"], facecolor="#f8fafc", linewidth=1.5)
        ax.add_patch(card)

        # Header tag
        tag = FancyBboxPatch((x + 2, 70), 16.5, 9, boxstyle="round,pad=0.5", 
                             edgecolor=s["color"], facecolor=s["color"], linewidth=1)
        ax.add_patch(tag)
        ax.text(x + 10.25, 75.5, s["num"], fontsize=10, fontweight='bold', ha='center', va='center', color='#ffffff')
        ax.text(x + 10.25, 64, s["title"], fontsize=9.5, fontweight='bold', ha='center', va='center', color='#0f172a', linespacing=1.2)

        # Divider
        ax.plot([x + 1, x + 19.5], [58, 58], color='#cbd5e1', lw=1)

        # Sub-boxes
        # Input
        ax.text(x + 1.5, 54, "[Đầu vào]", fontsize=8.5, fontweight='bold', color=s["color"])
        ax.text(x + 1.5, 46, s["input"], fontsize=7.8, color='#334155', linespacing=1.25)

        # Process
        ax.text(x + 1.5, 38, "[Thực hiện]", fontsize=8.5, fontweight='bold', color='#0f172a')
        ax.text(x + 1.5, 27, s["process"], fontsize=7.8, color='#334155', linespacing=1.25)

        # Output
        ax.text(x + 1.5, 19, "[Đầu ra]", fontsize=8.5, fontweight='bold', color='#16a34a')
        ax.text(x + 1.5, 12, s["output"], fontsize=7.8, color='#334155', linespacing=1.25)

        # Connector arrow
        if i < len(steps) - 1:
            ax.annotate('', xy=(x + 23.5, 44), xytext=(x + 20.8, 44),
                        arrowprops=dict(arrowstyle="->", color="#0f172a", lw=2))

    plt.tight_layout()
    plt.savefig('docs/images/workflow_diagram.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("workflow_diagram.png created.")

def create_prompt_framework_diagram():
    fig, ax = plt.subplots(figsize=(12, 4.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    ax.text(50, 92, "MÔ HÌNH CẤU TRÚC PROMPT CHUẨN ĐIỀU KHIỂN AI AGENT (6 THÀNH PHẦN)", 
            fontsize=13.5, fontweight='bold', ha='center', color='#0f172a')
    ax.text(50, 85, "Đảm bảo AI Agent sinh mã nguồn chính xác, đầy đủ ngữ cảnh và không bị lạc đề", 
            fontsize=10, fontstyle='italic', ha='center', color='#475569')

    boxes = [
        {"name": "ROLE", "vn": "Vai trò", "desc": "Kỹ sư AI Full-stack,\nChuyên gia RAG System", "color": "#1e3a8a", "x": 3},
        {"name": "CONTEXT", "vn": "Bối cảnh", "desc": "Kiến trúc hệ thống, Tech-\nstack, CSDL hiện có", "color": "#0369a1", "x": 19},
        {"name": "OBJECTIVE", "vn": "Mục tiêu", "desc": "Nhiệm vụ cụ thể cần hoàn\nthành cho từng bước", "color": "#047857", "x": 35},
        {"name": "REQUIREMENTS", "vn": "Yêu cầu", "desc": "Thông số kỹ thuật, logic\nxử lý, thuật toán", "color": "#b45309", "x": 51},
        {"name": "CONSTRAINTS", "vn": "Ràng buộc", "desc": "Giới hạn công nghệ, chống\nảo giác, bảo mật", "color": "#b91c1c", "x": 67},
        {"name": "OUTPUT", "vn": "Đầu ra", "desc": "File mã nguồn, cấu trúc\nJSON, tiêu chí nghiệm thu", "color": "#6d28d9", "x": 83},
    ]

    for b in boxes:
        x = b["x"]
        card = FancyBboxPatch((x, 10), 14, 68, boxstyle="round,pad=0.8", 
                              edgecolor=b["color"], facecolor="#f8fafc", linewidth=1.5)
        ax.add_patch(card)

        # Header tag
        tag = FancyBboxPatch((x + 0.8, 62), 12.4, 12, boxstyle="round,pad=0.4", 
                             edgecolor=b["color"], facecolor=b["color"], linewidth=1)
        ax.add_patch(tag)
        ax.text(x + 7, 70, b["name"], fontsize=9.5, fontweight='bold', ha='center', va='center', color='#ffffff')
        ax.text(x + 7, 65, f"({b['vn']})", fontsize=8, ha='center', va='center', color='#f1f5f9')

        ax.text(x + 7, 36, b["desc"], fontsize=8.5, ha='center', va='center', color='#334155', linespacing=1.3)

    plt.tight_layout()
    plt.savefig('docs/images/prompt_framework_diagram.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("prompt_framework_diagram.png created.")

if __name__ == '__main__':
    create_architecture_diagram()
    create_workflow_diagram()
    create_prompt_framework_diagram()
