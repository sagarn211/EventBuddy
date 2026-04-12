import API from "./api";

/**
 * Upload a file to ImageKit via the local backend
 * @param {string} uri Local file URI
 * @param {string} fileName Name of the file
 * @param {string} type MIME type (image/jpeg, video/mp4, etc.)
 * @param {string} folder Folder name in ImageKit (avatars, stories, etc.)
 * @returns {Promise} Upload response with URL and fileId
 */
export const uploadFile = async (uri, fileName, type, folder = 'misc') => {
  const formData = new FormData();
  
  // React Native version of multipart form-data
  formData.append('file', {
    uri: uri,
    name: fileName || `upload-${Date.now()}`,
    type: type || 'image/jpeg',
  });
  
  formData.append('folder', folder);

  return API.post("/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    // Required for some axios/React Native versions to handle FormData correctly
    transformRequest: (data, headers) => {
      return data;
    },
  });
};
