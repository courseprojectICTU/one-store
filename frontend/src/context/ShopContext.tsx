'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, CartItem, Customer } from '@/types';
import { api, imageOf } from '@/lib/api';
import { Locale, Dictionary, getDictionary, defaultLocale } from '@/locales';

const CART_KEY = 'one-store:cart:v1';
const MEMBER_TOKEN_KEY = 'one:member-token:v1';
const GUEST_INFO_KEY = 'one:guest-info:v1';
const LOCALE_KEY = 'one:locale:v1';

export type GuestInfo = {
  name: string;
  phone: string;
  address: string;
  note: string;
};

interface ShopContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: Dictionary;
  products: Product[];
  loadingProducts: boolean;
  refreshProducts: () => Promise<void>;
  cart: CartItem[];
  addToCart: (
    item: {
      product_id: number;
      product_name: string;
      size: string;
      color: string;
      quantity: number;
      unit_price: number;
      image_url?: string;
    },
    openDrawer?: boolean,
  ) => void;
  buyNow: (item: {
    product_id: number;
    product_name: string;
    size: string;
    color: string;
    quantity: number;
    unit_price: number;
    image_url?: string;
  }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  removeSelectedFromCart: (ids: string[]) => void;
  cartCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutMode: boolean;
  setIsCheckoutMode: (mode: boolean) => void;
  buyNowItem: CartItem | null;
  setBuyNowItem: (item: CartItem | null) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  memberToken: string;
  memberUser: Customer | null;
  setAuth: (token: string, user: Customer | null) => void;
  logout: () => Promise<void>;
  wishlistIds: number[];
  toggleWishlist: (productId: number) => Promise<void>;
  isWishlisted: (productId: number) => boolean;
  activeModal: 'wishlist' | 'detail' | 'sizeguide' | null;
  setActiveModal: (modal: 'wishlist' | 'detail' | 'sizeguide' | null) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  appliedVoucher: { code: string; discount: number } | null;
  setAppliedVoucher: (v: { code: string; discount: number } | null) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  guestInfo: GuestInfo;
  setGuestInfo: React.Dispatch<React.SetStateAction<GuestInfo>>;
  saveGuestInfo: (info: GuestInfo) => void;
  recentOrders: string[];
  addRecentOrder: (code: string) => void;
  cookieConsent: boolean;
  acceptCookieConsent: () => void;
  isCookieDeclined: boolean;
  declineCookieConsent: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const dict = getDictionary(locale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LOCALE_KEY, l);
    } catch {}
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeModal, setActiveModal] = useState<
    'wishlist' | 'detail' | 'sizeguide' | null
  >(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [memberToken, setMemberTokenState] = useState<string>('');
  const [memberUser, setMemberUserState] = useState<Customer | null>(null);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [recentOrders, setRecentOrders] = useState<string[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    name: '',
    phone: '',
    address: '',
    note: '',
  });
  const [cookieConsent, setCookieConsent] = useState<boolean>(false);
  const [isCookieDeclined, setIsCookieDeclined] = useState<boolean>(false);

  const checkIsCookieAccepted = useCallback((): boolean => {
    if (typeof document === 'undefined') return false;
    return (
      document.cookie.includes('one_cookie_consent=accepted') ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('one:cookie-consent') === 'accepted')
    );
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Load Locale, Cart, Token, Guest Info from localStorage on mount
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null;
      if (savedLocale === 'vi' || savedLocale === 'en') {
        setLocaleState(savedLocale);
      }
    } catch {
      // ignore
    }

    // Kiểm tra trạng thái chấp nhận Cookie
    const isConsent = checkIsCookieAccepted();
    setCookieConsent(isConsent);

    if (!isConsent) {
      // Khách hàng chưa chấp nhận lưu cookie: Dọn dẹp triệt để các dữ liệu đã lưu
      try {
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem('one:cart:v1');
        localStorage.removeItem('one-fashion:cart:v1');
        localStorage.removeItem('nhom2-ba-khi-shop:cart:v1');
        localStorage.removeItem('one:wishlist:v1');
        localStorage.removeItem('one:recent_orders');
        localStorage.removeItem(GUEST_INFO_KEY);
        if (typeof document !== 'undefined') {
          document.cookie = 'one_cart=; Path=/; Max-Age=0; SameSite=Lax';
          document.cookie = 'one_wishlist=; Path=/; Max-Age=0; SameSite=Lax';
        }
      } catch {}
      setCart([]);
      setWishlistIds([]);
      setRecentOrders([]);
      setGuestInfo({ name: '', phone: '', address: '', note: '' });
      try {
        const isDeclined = sessionStorage.getItem('one:cookie-declined') === 'true';
        if (isDeclined) {
          setIsCookieDeclined(true);
        }
      } catch {}
    } else {
      // Khách hàng ĐÃ chấp nhận lưu cookie: Khôi phục giỏ hàng từ cookie 'one_cart' (hoặc localStorage)
      try {
        let loadedCart: any = null;
        if (typeof document !== 'undefined') {
          const match = document.cookie.match(/(?:^|;\s*)one_cart=([^;]+)/);
          if (match) {
            loadedCart = JSON.parse(decodeURIComponent(match[1]));
          }
        }
        if (!loadedCart) {
          const saved = localStorage.getItem(CART_KEY) || localStorage.getItem('one:cart:v1');
          if (saved) loadedCart = JSON.parse(saved);
        }
        if (Array.isArray(loadedCart)) {
          setCart(loadedCart);
        }
      } catch {}

      // Khôi phục Danh mục yêu thích từ cookie 'one_wishlist' (hoặc localStorage)
      try {
        let loadedWishlist: any = null;
        const savedWishlist = localStorage.getItem('one:wishlist:v1');
        if (savedWishlist) {
          loadedWishlist = JSON.parse(savedWishlist);
        } else if (typeof document !== 'undefined') {
          const match = document.cookie.match(/(?:^|;\s*)one_wishlist=([^;]+)/);
          if (match) {
            loadedWishlist = JSON.parse(decodeURIComponent(match[1]));
          }
        }
        if (Array.isArray(loadedWishlist)) {
          setWishlistIds(loadedWishlist.map(Number));
        }
      } catch {}

      // Khôi phục Danh sách đơn hàng đã mua
      try {
        const savedOrders = localStorage.getItem('one:recent_orders');
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed)) setRecentOrders(parsed);
        }
      } catch {}

      // Khôi phục Thông tin khách hàng đã lưu
      try {
        const savedGuest = localStorage.getItem(GUEST_INFO_KEY);
        if (savedGuest) {
          const parsed = JSON.parse(savedGuest);
          if (parsed && typeof parsed === 'object') {
            setGuestInfo(parsed);
          }
        }
      } catch {}
    }

    try {
      const savedToken = sessionStorage.getItem(MEMBER_TOKEN_KEY) || sessionStorage.getItem('bakhi:member-token:v3');
      if (savedToken) {
        setMemberTokenState(savedToken);
      }
    } catch {
      // ignore
    }
  }, [checkIsCookieAccepted]);

  const saveGuestInfo = useCallback(
    (info: GuestInfo) => {
      setGuestInfo(info);
      if (cookieConsent || checkIsCookieAccepted()) {
        try {
          localStorage.setItem(GUEST_INFO_KEY, JSON.stringify(info));
        } catch {}
      }
    },
    [cookieConsent, checkIsCookieAccepted],
  );

  const addRecentOrder = useCallback(
    (orderCode: string) => {
      setRecentOrders((prev) => {
        const updated = [orderCode, ...prev.filter((c) => c !== orderCode)].slice(0, 10);
        if (cookieConsent || checkIsCookieAccepted()) {
          try {
            localStorage.setItem('one:recent_orders', JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
    },
    [cookieConsent, checkIsCookieAccepted],
  );

  // Lưu Giỏ hàng vào Cookie & localStorage khi có thay đổi (chỉ lưu nếu khách hàng đã chấp nhận cookie)
  useEffect(() => {
    if (!cookieConsent && !checkIsCookieAccepted()) {
      // Chưa chấp nhận cookie -> Không lưu vào cookie hay localStorage lâu dài
      // Tải lại trang sẽ tự động biến mất giỏ hàng theo đúng yêu cầu
      return;
    }
    try {
      const serialized = JSON.stringify(cart);
      localStorage.setItem(CART_KEY, serialized);
      if (typeof document !== 'undefined') {
        document.cookie = `one_cart=${encodeURIComponent(serialized)}; Path=/; Max-Age=315360000; SameSite=Lax`;
      }
    } catch {
      // ignore
    }
  }, [cart, cookieConsent, checkIsCookieAccepted]);

  const refreshProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await api('/api/products');
      if (Array.isArray(res.products)) {
        setProducts(res.products);
      }
    } catch (e: any) {
      console.error('Failed to load products', e);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Fetch Member User Profile & Wishlist when token is present
  useEffect(() => {
    if (!memberToken) {
      setMemberUserState(null);
      setWishlistIds([]);
      return;
    }
    const headers = { Authorization: `Bearer ${memberToken}` };
    api('/api/auth/me', { headers })
      .then((data) => {
        if (data.customer) setMemberUserState(data.customer);
      })
      .catch(() => {
        setMemberTokenState('');
        try {
          sessionStorage.removeItem(MEMBER_TOKEN_KEY);
        } catch {}
      });

    api('/api/wishlist', { headers })
      .then((data) => {
        if (Array.isArray(data.items)) {
          setWishlistIds(data.items.map((i: any) => Number(i.id || i.product_id)));
        }
      })
      .catch(() => {});
  }, [memberToken]);

  const setAuth = useCallback((token: string, user: Customer | null) => {
    setMemberTokenState(token);
    setMemberUserState(user);
    try {
      if (token) {
        sessionStorage.setItem(MEMBER_TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(MEMBER_TOKEN_KEY);
      }
    } catch {}
  }, []);

  const logout = useCallback(async () => {
    if (memberToken) {
      try {
        await api('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${memberToken}` },
        });
      } catch {}
    }
    setAuth('', null);
    setWishlistIds([]);
    showToast(dict.messages.logout_success);
  }, [memberToken, setAuth, showToast, dict.messages.logout_success]);

  const toggleWishlist = useCallback(async (productId: number) => {
    const exists = wishlistIds.includes(productId);
    const updated = exists
      ? wishlistIds.filter((id) => id !== productId)
      : [...wishlistIds, productId];

    setWishlistIds(updated);
    if (exists) {
      showToast(dict.messages.wishlist_removed);
    } else {
      showToast(dict.messages.wishlist_added);
    }

    if (cookieConsent || checkIsCookieAccepted()) {
      try {
        localStorage.setItem('one:wishlist:v1', JSON.stringify(updated));
        if (typeof document !== 'undefined') {
          document.cookie = `one_wishlist=${encodeURIComponent(JSON.stringify(updated))}; Path=/; Max-Age=315360000; SameSite=Lax`;
        }
      } catch {}
    }

    if (memberToken) {
      const headers = { Authorization: `Bearer ${memberToken}` };
      if (exists) {
        api(`/api/wishlist/${productId}`, { method: 'DELETE', headers }).catch(() => {});
      } else {
        api('/api/wishlist', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: productId }),
        }).catch(() => {});
      }
    }
  }, [memberToken, wishlistIds, showToast, dict.messages, cookieConsent, checkIsCookieAccepted]);

  const declineCookieConsent = useCallback(() => {
    setIsCookieDeclined(true);
    try {
      sessionStorage.setItem('one:cookie-declined', 'true');
    } catch {}
  }, []);

  const acceptCookieConsent = useCallback(() => {
    setIsCookieDeclined(false);
    try {
      sessionStorage.removeItem('one:cookie-declined');
    } catch {}
    try {
      localStorage.setItem('one:cookie-consent', 'accepted');
      if (typeof document !== 'undefined') {
        document.cookie = 'one_cookie_consent=accepted; Path=/; Max-Age=315360000; SameSite=Lax';
      }
      setCookieConsent(true);

      // Lưu ngay giỏ hàng hiện tại vào cookie & localStorage
      if (cart.length > 0) {
        const serialized = JSON.stringify(cart);
        localStorage.setItem(CART_KEY, serialized);
        if (typeof document !== 'undefined') {
          document.cookie = `one_cart=${encodeURIComponent(serialized)}; Path=/; Max-Age=315360000; SameSite=Lax`;
        }
      }

      // Lưu ngay danh sách yêu thích hiện tại vào cookie & localStorage
      if (wishlistIds.length > 0) {
        const serializedWishlist = JSON.stringify(wishlistIds);
        localStorage.setItem('one:wishlist:v1', serializedWishlist);
        if (typeof document !== 'undefined') {
          document.cookie = `one_wishlist=${encodeURIComponent(serializedWishlist)}; Path=/; Max-Age=315360000; SameSite=Lax`;
        }
      }

      // Lưu ngay thông tin người mua (guestInfo) vào localStorage
      if (guestInfo.name || guestInfo.phone || guestInfo.address) {
        localStorage.setItem(GUEST_INFO_KEY, JSON.stringify(guestInfo));
      }

      // Lưu ngay lịch sử mã đơn hàng gần đây (recentOrders) vào localStorage
      if (recentOrders.length > 0) {
        localStorage.setItem('one:recent_orders', JSON.stringify(recentOrders));
      }

      showToast(dict.common.cookie_consent?.accepted_toast || 'Đã bật ghi nhớ giỏ hàng & sản phẩm yêu thích trên thiết bị');
    } catch {
      // ignore
    }
  }, [cart, wishlistIds, guestInfo, recentOrders, showToast, dict.common.cookie_consent]);

  const isWishlisted = useCallback((productId: number) => {
    return wishlistIds.includes(productId);
  }, [wishlistIds]);

  const addToCart = useCallback(
    (
      item: {
        product_id: number;
        product_name: string;
        size: string;
        color: string;
        quantity: number;
        unit_price: number;
        image_url?: string;
      },
      openDrawer: boolean = false,
    ) => {
      const id = `${item.product_id}-${item.size}-${item.color}`;
      setCart((prev) => {
        const idx = prev.findIndex((i) => i.id === id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
          return next;
        }
        return [
          ...prev,
          {
            id,
            product_id: item.product_id,
            product_name: item.product_name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            unit_price: item.unit_price,
            image_url: item.image_url || imageOf({ id: item.product_id }),
          },
        ];
      });
      if (openDrawer) {
        setIsCheckoutMode(false);
        setIsCartOpen(true);
      }
      showToast(dict.messages.add_to_cart_success(item.product_name, item.size));
    },
    [showToast, dict.messages],
  );

  const buyNow = useCallback(
    (item: {
      product_id: number;
      product_name: string;
      size: string;
      color: string;
      quantity: number;
      unit_price: number;
      image_url?: string;
    }) => {
      const directItem: CartItem = {
        id: `direct-${item.product_id}-${item.size}-${item.color}-${Date.now()}`,
        product_id: item.product_id,
        product_name: item.product_name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unit_price: item.unit_price,
        image_url: item.image_url || imageOf({ id: item.product_id }),
      };
      setBuyNowItem(directItem);
      setIsCheckoutMode(true);
      setIsCartOpen(true);
      showToast(dict.messages.buy_now_redirect(item.product_name));
    },
    [showToast, dict.messages],
  );

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const newQ = Math.max(1, i.quantity + delta);
          return { ...i, quantity: newQ };
        }
        return i;
      }),
    );
  }, []);

  const removeSelectedFromCart = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setCart((prev) => prev.filter((i) => !idSet.has(i.id)));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedVoucher(null);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return (
    <ShopContext.Provider
      value={{
        locale,
        setLocale,
        dict,
        products,
        loadingProducts,
        refreshProducts,
        cart,
        addToCart,
        buyNow,
        removeFromCart,
        updateQuantity,
        clearCart,
        removeSelectedFromCart,
        cartCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        isCheckoutMode,
        setIsCheckoutMode,
        buyNowItem,
        setBuyNowItem,
        selectedProduct,
        setSelectedProduct,
        memberToken,
        memberUser,
        setAuth,
        logout,
        wishlistIds,
        toggleWishlist,
        isWishlisted,
        activeModal,
        setActiveModal,
        toastMessage,
        showToast,
        appliedVoucher,
        setAppliedVoucher,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        guestInfo,
        setGuestInfo,
        saveGuestInfo,
        recentOrders,
        addRecentOrder,
        cookieConsent,
        acceptCookieConsent,
        isCookieDeclined,
        declineCookieConsent,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
