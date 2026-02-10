import { useEffect, useState, useCallback } from "react";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface FacebookSDKState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

interface FacebookLoginResponse {
  status: "connected" | "not_authorized" | "unknown";
  authResponse?: {
    accessToken: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
  };
}

export function useFacebookSDK() {
  const [state, setState] = useState<FacebookSDKState>({
    isLoaded: false,
    isLoading: true,
    error: null,
  });
  const [appId, setAppId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config/facebook-app-id", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setAppId(data.appId))
      .catch((err) => console.error("Failed to get Facebook App ID:", err));
  }, []);

  useEffect(() => {
    if (!appId) return;

    if (window.FB) {
      setState({ isLoaded: true, isLoading: false, error: null });
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: "v21.0",
      });
      setState({ isLoaded: true, isLoading: false, error: null });
    };

    const existingScript = document.getElementById("facebook-jssdk");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/pt_BR/sdk.js";
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setState({
          isLoaded: false,
          isLoading: false,
          error: "Failed to load Facebook SDK",
        });
      };
      document.body.appendChild(script);
    }

    return () => {
    };
  }, [appId]);

  const login = useCallback(
    (): Promise<FacebookLoginResponse> => {
      return new Promise((resolve, reject) => {
        if (!window.FB) {
          reject(new Error("Facebook SDK not loaded"));
          return;
        }

        window.FB.login(
          (response: FacebookLoginResponse) => {
            resolve(response);
          },
          {
            scope: [
              "instagram_basic",
              "instagram_manage_messages",
              "instagram_manage_comments",
              "pages_show_list",
              "pages_read_engagement",
              "pages_messaging",
              "business_management",
            ].join(","),
            auth_type: "rerequest",
          }
        );
      });
    },
    []
  );

  const getLoginStatus = useCallback((): Promise<FacebookLoginResponse> => {
    return new Promise((resolve, reject) => {
      if (!window.FB) {
        reject(new Error("Facebook SDK not loaded"));
        return;
      }
      window.FB.getLoginStatus((response: FacebookLoginResponse) => {
        resolve(response);
      });
    });
  }, []);

  const logout = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.FB) {
        resolve();
        return;
      }
      window.FB.logout(() => {
        resolve();
      });
    });
  }, []);

  return {
    ...state,
    login,
    logout,
    getLoginStatus,
  };
}
