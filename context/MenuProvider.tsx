import { createContext, useContext, useState, type ReactNode } from 'react';

type MenuContextValue = { visible: boolean; open: () => void; close: () => void };

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

// Un seul menu (☰) partagé par toute l'application : accessible depuis l'en-tête de chaque
// écran (onglets principaux comme pages de détail), pour que la barre du haut soit disponible
// partout sans dupliquer l'état d'ouverture par écran.
export function MenuProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <MenuContext.Provider value={{ visible, open: () => setVisible(true), close: () => setVisible(false) }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used within a MenuProvider');
  return ctx;
}
