import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const isElectron = typeof window !== 'undefined' && !!window.mondiro;
export const APP_VERSION = __APP_VERSION__;
export const REPO = 'satthupc00/Money_Lover';
