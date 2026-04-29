import axiosClient from './axiosClient';

const classworkApi = {
  // Classworks
  getClassworks: (classId) =>
    axiosClient.get(`/class/${classId}/classworks`),

  getClassworkDetail: (classId, classworkId) =>
    axiosClient.get(`/class/${classId}/classworks/${classworkId}`),

  createClasswork: (classId, data) =>
    axiosClient.post(`/class/${classId}/classworks`, data),

  // Topics
  getTopics: (classId) =>
    axiosClient.get(`/class/${classId}/topics`),

  createTopic: (classId, data) =>
    axiosClient.post(`/class/${classId}/topics`, data),

  updateTopic: (classId, data) =>
    axiosClient.put(`/class/${classId}/topics`, data),

  deleteTopic: (classId, topicId) =>
    axiosClient.delete(`/class/${classId}/topics/${topicId}`),

  moveClassworkToTopic: (classId, classworkId, topicId) =>
    axiosClient.patch(`/class/${classId}/classworks/${classworkId}/topic`, { topicId }),

  // Submissions
  getSubmissions: (classId, classworkId) =>
    axiosClient.get(`/class/${classId}/classworks/${classworkId}/submissions`),

  getMySubmission: (classId, classworkId) =>
    axiosClient.get(`/class/${classId}/classworks/${classworkId}/submissions/my`),

  // Upload file đính kèm vào submission (trả về attachmentId)
  uploadSubmissionFile: (classId, classworkId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return axiosClient.post(
      `/class/${classId}/classworks/${classworkId}/submissions/attachments`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  // Nộp bài (gửi danh sách attachmentIds đã upload)
  turnIn: (classId, classworkId, data) =>
    axiosClient.post(`/class/${classId}/classworks/${classworkId}/submissions/turn-in`, data),

  // Hủy nộp
  unsubmit: (classId, classworkId) =>
    axiosClient.patch(`/class/${classId}/classworks/${classworkId}/submissions/unsubmit`),

  // Chấm điểm (teacher, by studentId)
  grade: (classId, classworkId, studentId, data) =>
    axiosClient.patch(`/class/${classId}/classworks/${classworkId}/submissions/${studentId}/grade`, data),
};

export default classworkApi;
