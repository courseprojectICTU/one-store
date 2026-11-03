import os
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

def create_rag_pipeline_diagram():
    fig, ax = plt.subplots(figsize=(13, 6.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    fig.patch.set_facecolor('#ffffff')
    ax.set_facecolor('#ffffff')

    ax.text(50, 94, "FLOWCHART CHI TIẾT: PIPELINE XỬ LÝ TRUY VẤN RAG BACKEND", 
            fontsize=14.5, fontweight='bold', ha='center', color='#0f172a')
    ax.text(50, 88.5, "Chuỗi 6 bước khép kín từ khi tiếp nhận câu hỏi đến khi phản hồi kèm trích dẫn nguồn", 
            fontsize=10.5, fontstyle='italic', ha='center', color='#475569')

    pipeline_steps = [
        {"num": "1", "name": "TIẾP NHẬN & VALIDATE", "sub": "POST /api/chat", "desc": "• Kiểm tra độ dài câu hỏi (2-600 ký tự)\n• Chống prompt injection & spam", "color": "#1e40af", "x": 4, "y": 50},
        {"num": "2", "name": "VECTOR HÓA CÂU HỎI", "sub": "Embedding Model", "desc": "• Chuyển câu hỏi thành vector 1024d\n• Mô hình: @cf/baai/bge-m3", "color": "#0284c7", "x": 37, "y": 50},
        {"num": "3", "name": "TÌM KIẾM TƯƠNG ĐỒNG", "sub": "Vector Database", "desc": "• Quét Cosine Similarity Top-5 vector\n• Lấy mảng Chunk IDs liên quan nhất", "color": "#059669", "x": 70, "y": 50},
        {"num": "4", "name": "TRÍCH XUẤT VĂN BẢN", "sub": "Knowledge Base (D1)", "desc": "• SELECT chunks + metadata sản phẩm\n• Ghép thành Context tri thức thực", "color": "#d97706", "x": 70, "y": 10},
        {"num": "5", "name": "ĐÓNG GÓI & SUY LUẬN", "sub": "LLM Gemma AI", "desc": "• Ghép: [System Prompt] + [Context] + [Q]\n• LLM suy luận, neo chặt vào tài liệu", "color": "#7c3aed", "x": 37, "y": 10},
        {"num": "6", "name": "PHẢN HỒI KÈM SOURCES", "sub": "JSON Response", "desc": "• Bóc tách reasoning nếu có\n• Trả về: { answer, sources: [...] }", "color": "#be123c", "x": 4, "y": 10},
    ]

    for p in pipeline_steps:
        x, y = p["x"], p["y"]
        card = FancyBboxPatch((x, y), 26, 31, boxstyle="round,pad=1.0",
                              edgecolor=p["color"], facecolor="#f8fafc", linewidth=1.5)
        ax.add_patch(card)

        # Header tag
        tag = FancyBboxPatch((x + 1, y + 21), 24, 8, boxstyle="round,pad=0.4",
                             edgecolor=p["color"], facecolor=p["color"], linewidth=1)
        ax.add_patch(tag)
        ax.text(x + 13, y + 25, f"BƯỚC {p['num']}: {p['name']}", fontsize=8.5, fontweight='bold', ha='center', va='center', color='#ffffff')
        ax.text(x + 13, y + 17, f"({p['sub']})", fontsize=8, fontweight='bold', ha='center', color=p["color"])
        ax.text(x + 2, y + 9, p["desc"], fontsize=8, color='#334155', linespacing=1.3)

    # Arrows connecting 1 -> 2 -> 3
    ax.annotate('', xy=(37, 65.5), xytext=(30, 65.5),
                arrowprops=dict(arrowstyle="->", color="#0f172a", lw=2))
    ax.annotate('', xy=(70, 65.5), xytext=(63, 65.5),
                arrowprops=dict(arrowstyle="->", color="#0f172a", lw=2))

    # Arrow 3 -> 4 (down)
    ax.annotate('', xy=(83, 41), xytext=(83, 50),
                arrowprops=dict(arrowstyle="->", color="#0f172a", lw=2))

    # Arrows connecting 4 -> 5 -> 6 (back left)
    ax.annotate('', xy=(63, 25.5), xytext=(70, 25.5),
                arrowprops=dict(arrowstyle="->", color="#0f172a", lw=2))
    ax.annotate('', xy=(30, 25.5), xytext=(37, 25.5),
                arrowprops=dict(arrowstyle="->", color="#0f172a", lw=2))

    plt.tight_layout()
    plt.savefig('docs/images/rag_pipeline_diagram.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("rag_pipeline_diagram.png created.")

if __name__ == '__main__':
    create_rag_pipeline_diagram()
