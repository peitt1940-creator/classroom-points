/* No credentials or student data are stored in this repository. */
(() => {
  'use strict';
  let sessionToken = '';
  const allowed = new Set('handleLogin getPublicInitData getDashboardData getStudentDashboardData getClassroomDashboard getStudentPetState adoptStudentPet renameStudentPet equipPetAccessory exportSettlementPdf submitScoresBulk updateStudentRecord markAnnouncementRead reviewRecord bulkGrantRewards bulkReviewScores savePetTopics updateLeaderboardConfig createAnnouncement updateAnnouncement compactLegacyRecords getDateDiagnostics getSavedSettlement importCompressedRecords markBulletinRead markTaskRead previewRecordCompaction previewSettlement reviewLearningTask saveBulletin saveClassroomSettings saveSettlement setTaskArchived submitLearningTask'.split(' '));
  async function call(action, args) {
    if (!allowed.has(action)) throw new Error('不支援此操作');
    // Pre-login screens never request student names, points, or announcements.
    if (action === 'getPublicInitData' && !sessionToken) return {leaderboard:[],config:{weeks:[],formula:[],noteTopics:[]}};
    const apiUrl = window.CLASSROOM_CONFIG?.apiUrl || '';
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(apiUrl)) {
      throw new Error('網站尚未連接正式後端，請老師完成連線設定後再登入。');
    }
    if (action !== 'handleLogin' && !sessionToken) throw new Error('請重新登入');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(apiUrl, {
        method:'POST', mode:'cors', credentials:'omit', redirect:'follow',
        headers:{'Content-Type':'text/plain;charset=UTF-8'},
        body:JSON.stringify({version:1,action,args,token:sessionToken}),
        signal:controller.signal, cache:'no-store', referrerPolicy:'no-referrer'
      });
      if (!response.ok) throw new Error('伺服器暫時無法回應');
      let envelope;
      try { envelope=await response.json(); } catch { throw new Error('後端回應格式不正確，請檢查部署權限與版本'); }
      if (envelope.ok !== true) throw new Error(envelope.error || '操作失敗');
      if (action === 'handleLogin') {
        if (!envelope.data?.sessionToken) throw new Error('未取得有效登入狀態');
        sessionToken=envelope.data.sessionToken;
      }
      return envelope.data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('連線逾時，結果尚未確認。請重新讀取紀錄，確認後再決定是否重送。');
      if (error instanceof TypeError) throw new Error('無法連接後端，請確認網路與部署設定。若剛才送出資料，請先重新讀取確認結果。');
      throw error;
    } finally { clearTimeout(timer); }
  }
  window.classroomAPI=Object.freeze({call,clearSession:()=>{sessionToken='';}});
})();
