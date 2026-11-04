/**
 * Trình giải mã luồng Server-Sent Events (SSE Stream Parser)
 * Dự án One - Store — Trợ lý "Tư vấn One v2.0"
 * 
 * Hỗ trợ nhận diện và điều phối các sự kiện thời gian thực:
 * - status: Cập nhật thông báo tiến trình xử lý
 * - delta: Truyền từng mảnh token văn bản suy luận
 * - products: Trả về danh sách thẻ sản phẩm D1 đối soát
 * - sources: Danh mục tài liệu RAG căn cứ
 * - order_ready: Bảng tóm tắt thông tin đơn hàng đã thẩm định
 * - order_created: Thẻ xác nhận đơn hàng VIP đã tạo thành công trong D1
 * - done: Báo hiệu kết thúc phiên stream
 */

export interface SSEEventHandlers {
  onStatus?: (message: string) => void;
  onDelta?: (text: string) => void;
  onProducts?: (products: any[]) => void;
  onSources?: (sources: string[]) => void;
  onOrderReady?: (data: { pendingOrder: any; readyToConfirm: boolean }) => void;
  onOrderCreated?: (createdOrder: any) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export async function readSSEStream(
  response: Response,
  handlers: SSEEventHandlers,
  signal?: AbortSignal,
): Promise<void> {
  if (!response.body) {
    throw new Error('Phản hồi từ máy chủ không chứa luồng dữ liệu (ReadableStream)');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = 'message';
      let currentData = '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          if (currentData) {
            dispatchEvent(currentEvent, currentData, handlers);
            currentEvent = 'message';
            currentData = '';
          }
          continue;
        }

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim();
        } else if (trimmed.startsWith('data:')) {
          const dataContent = trimmed.slice(5).trim();
          currentData = currentData ? currentData + '\n' + dataContent : dataContent;
        }
      }

      if (currentData) {
        dispatchEvent(currentEvent, currentData, handlers);
      }
    }

    if (buffer.trim()) {
      const line = buffer.trim();
      if (line.startsWith('data:')) {
        dispatchEvent('message', line.slice(5).trim(), handlers);
      }
    }

    handlers.onDone?.();
  } catch (err: any) {
    if (signal?.aborted) return;
    handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
  } finally {
    reader.releaseLock();
  }
}

function dispatchEvent(event: string, dataStr: string, handlers: SSEEventHandlers) {
  if (dataStr === '[DONE]') {
    handlers.onDone?.();
    return;
  }

  let data: any = null;
  try {
    data = JSON.parse(dataStr);
  } catch {
    data = dataStr;
  }

  switch (event) {
    case 'status':
      if (typeof data === 'object' && data?.message) {
        handlers.onStatus?.(data.message);
      } else if (typeof data === 'string') {
        handlers.onStatus?.(data);
      }
      break;
    case 'delta':
      if (typeof data === 'object' && data?.text) {
        handlers.onDelta?.(data.text);
      } else if (typeof data === 'string') {
        handlers.onDelta?.(data);
      }
      break;
    case 'products':
      if (Array.isArray(data?.products)) {
        handlers.onProducts?.(data.products);
      } else if (Array.isArray(data)) {
        handlers.onProducts?.(data);
      }
      break;
    case 'sources':
      if (Array.isArray(data?.sources)) {
        handlers.onSources?.(data.sources);
      } else if (Array.isArray(data)) {
        handlers.onSources?.(data);
      }
      break;
    case 'order_ready':
      handlers.onOrderReady?.(data);
      break;
    case 'order_created':
      handlers.onOrderCreated?.(data?.createdOrder || data);
      break;
    case 'done':
      handlers.onDone?.();
      break;
    default:
      if (data?.text) handlers.onDelta?.(data.text);
      break;
  }
}

