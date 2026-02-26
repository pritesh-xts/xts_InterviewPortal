// export async function getStatuses() {
//   const response = await fetch(`${API_BASE}api/status/getAll.php`);
//   const result = await response.json();

//   if (!result.success) {
//     throw new Error(result.message || 'Failed to fetch statuses');
//   }

//   return result.data || [];
// }


// export const getPanels = async () => {
//   const response = await fetch(`${API_BASE}api/users/getPanels.php`);
//   const result = await response.json();

//   if (!result.success) {
//     throw new Error(result.message || 'Failed to fetch panels');
//   }

//   return result.data || [];
// };


export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost/xts_interviewPortal/';

export async function getStatuses() {
  const response = await fetch(`${API_BASE}api/status/getAll.php`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch statuses');
  }

  return result.data || [];
}

export const getPanels = async () => {
  const response = await fetch(`${API_BASE}api/users/getPanels.php`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch panels');
  }

  return result.data || [];
};

export async function createCandidate(payload) {
  const response = await fetch(`${API_BASE}api/candidates/create.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  return result;
}

export async function uploadCandidateResume(candidateId, file) {
  const formData = new FormData();
  formData.append('candidateId', String(candidateId));
  formData.append('resume', file);

  const response = await fetch(`${API_BASE}api/candidates/uploadResume.php`, {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || 'Resume upload failed');
  }

  return result.data || {};
}
