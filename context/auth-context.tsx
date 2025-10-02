"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/utils/supabase"
import type { User } from "@supabase/supabase-js"

interface AuthContextProps {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // タイムアウト設定（10秒で強制的にローディングを終了）
    const timeoutId = setTimeout(() => {
      console.log("Auth context: Timeout reached, stopping loading");
      setIsLoading(false);
    }, 10000);

    // 認証状態を取得する関数
    const getSession = async () => {
      try {
        console.log("Auth context: Getting session...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {          
          console.log("Auth context: User found in session:", session.user.email);
          setUser(session.user);
        } else {
          console.log("Auth context: No user found in session");
          setUser(null);
        }
      } catch (error) {
        console.error("Auth context: Error getting session:", error);
        setUser(null);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    // 初期認証状態を確認
    getSession();

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth context: Auth state changed, event:", _event);
      setUser(session?.user || null);
    });

    // クリーンアップ
    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // ログアウト関数
  const logout = async () => {
    try {
      // Supabase認証からサインアウト
      await supabase.auth.signOut();
      setUser(null);
      
      // ホームページにリダイレクト
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return <AuthContext.Provider value={{ user, isLoading, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
