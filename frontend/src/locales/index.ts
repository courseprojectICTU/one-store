import { commonVi } from './vi/common';
import { productVi } from './vi/product';
import { checkoutVi } from './vi/checkout';
import { messagesVi } from './vi/messages';
import { modalsVi } from './vi/modals';
import { policiesVi } from './vi/policies';

import { commonEn } from './en/common';
import { productEn } from './en/product';
import { checkoutEn } from './en/checkout';
import { messagesEn } from './en/messages';
import { modalsEn } from './en/modals';
import { policiesEn } from './en/policies';

import { Dictionary, Locale } from './types';

export const dictionaries: Record<Locale, Dictionary> = {
  vi: {
    common: commonVi,
    product: productVi,
    checkout: checkoutVi,
    messages: messagesVi,
    modals: modalsVi,
    policies: policiesVi,
  },
  en: {
    common: commonEn,
    product: productEn,
    checkout: checkoutEn,
    messages: messagesEn,
    modals: modalsEn,
    policies: policiesEn,
  },
};

export const defaultLocale: Locale = 'vi';

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries[defaultLocale];
}

export * from './types';
