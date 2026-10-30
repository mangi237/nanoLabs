import { createContext, useContext } from 'react';

export type Params = Record<string, string>;
export type Route = { name: string; params?: Params };
export type NavApi = { go: (name: string, params?: Params) => void; back: () => void };

export const NavContext = createContext<NavApi>({ go: () => {}, back: () => {} });
export const useNav = () => useContext(NavContext);