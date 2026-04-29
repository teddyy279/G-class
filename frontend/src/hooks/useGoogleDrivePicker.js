import { useState, useEffect } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// NOTE: You must add VITE_GOOGLE_API_KEY to your .env file
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export default function useGoogleDrivePicker() {
  const [isReady, setIsReady] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);

  useEffect(() => {
    let gapiLoaded = false;
    let gisLoaded = false;

    const checkReady = () => {
      if (gapiLoaded && gisLoaded) {
        setIsReady(true);
      }
    };

    // Load Google API (gapi)
    const loadGapi = () => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('picker', { callback: () => { gapiLoaded = true; checkReady(); } });
      };
      document.body.appendChild(script);
    };

    // Load Google Identity Services (GIS)
    const loadGis = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // defined later during invocation
        });
        setTokenClient(client);
        gisLoaded = true;
        checkReady();
      };
      document.body.appendChild(script);
    };

    loadGapi();
    loadGis();
  }, []);

  const openPicker = (onSuccess, onError) => {
    if (!isReady || !tokenClient) {
      if (onError) onError('Google API is not ready yet');
      return;
    }

    if (!API_KEY) {
      alert('Vui lòng thêm VITE_GOOGLE_API_KEY vào file .env!');
      if (onError) onError('Missing API Key');
      return;
    }

    // Request access token
    tokenClient.callback = async (response) => {
      if (response.error !== undefined) {
        if (onError) onError(response.error);
        return;
      }

      // Open Picker
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
      // view.setIncludeFolders(true); // uncomment if you want to allow picking folders

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(response.access_token)
        .setDeveloperKey(API_KEY)
        .setCallback((data) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const files = data.docs;
            if (onSuccess) onSuccess(files);
          }
        })
        .build();

      picker.setVisible(true);
    };

    // Trigger OAuth flow
    tokenClient.requestAccessToken({ prompt: 'consent' });
  };

  return { openPicker, isReady };
}
