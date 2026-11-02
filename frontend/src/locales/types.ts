import { commonVi } from './vi/common';
import { productVi } from './vi/product';
import { checkoutVi } from './vi/checkout';
import { messagesVi } from './vi/messages';
import { modalsVi } from './vi/modals';
import { policiesVi } from './vi/policies';

export type Locale = 'vi' | 'en';

export interface Dictionary {
  common: typeof commonVi;
  product: typeof productVi;
  checkout: typeof checkoutVi;
  messages: typeof messagesVi;
  modals: typeof modalsVi;
  policies: typeof policiesVi;
}
