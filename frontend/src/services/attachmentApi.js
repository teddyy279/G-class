import axiosClient from './axiosClient';

const attachmentApi = {
  // Upload file (G-class/attachments/upload)
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosClient.post('/attachments/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Create link attachment (G-class/attachments/link)
  createLink: (url) => {
    return axiosClient.post('/attachments/link', { url });
  },
};

export default attachmentApi;
