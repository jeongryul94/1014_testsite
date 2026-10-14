const photoInput = document.getElementById('photoInput');
const dropzone = document.getElementById('dropzone');
const previewWrap = document.getElementById('previewWrap');
const photoPreview = document.getElementById('photoPreview');
const analyzeBtn = document.getElementById('analyzeBtn');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultsPanel = document.getElementById('resultsPanel');
const ocrText = document.getElementById('ocrText');
const ocrStatus = document.getElementById('ocrStatus');
let currentImageUrl = '';
let currentFile = null;

document.getElementById('dateInput').value = new Date().toISOString().slice(0,10);

const demoRisks = [
  {level:'높음', cls:'high-badge', title:'자재 적재 상태', desc:'적재물이 불안정해 보이는 경우 낙하 위험 여부와 적재 기준 준수 상태를 현장에서 확인하세요.'},
  {level:'중간', cls:'medium-badge', title:'통로 정리정돈', desc:'통로 장애물 유무와 비상 이동 경로 확보 상태를 확인하세요.'},
  {level:'확인 필요', cls:'check-badge', title:'보호구 착용 여부', desc:'사진만으로 판단하기 어려울 수 있으므로 작업자의 보호구 착용 여부를 직접 확인하세요.'}
];

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('JPG, PNG 등 이미지 파일을 선택해 주세요.');
    return;
  }
  currentFile = file;
  if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
  currentImageUrl = URL.createObjectURL(file);
  photoPreview.src = currentImageUrl;
  document.getElementById('fileName').textContent = file.name;
  previewWrap.classList.remove('hidden');
  analyzeBtn.disabled = false;
  resultsPanel.classList.add('hidden');
}
photoInput.addEventListener('change', e => loadFile(e.target.files[0]));
['dragenter','dragover'].forEach(evt => dropzone.addEventListener(evt, e => {
  e.preventDefault(); dropzone.classList.add('dragover');
}));
['dragleave','drop'].forEach(evt => dropzone.addEventListener(evt, e => {
  e.preventDefault(); dropzone.classList.remove('dragover');
}));
dropzone.addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));

document.getElementById('removePhoto').addEventListener('click', () => {
  currentFile = null;
  if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
  currentImageUrl = '';
  photoInput.value = '';
  previewWrap.classList.add('hidden');
  analyzeBtn.disabled = true;
  resultsPanel.classList.add('hidden');
});

function updateReport() {
  document.getElementById('reportArea').textContent = document.getElementById('areaInput').value.trim() || '미입력';
  document.getElementById('reportInspector').textContent = document.getElementById('inspectorInput').value.trim() || '미입력';
  document.getElementById('reportDate').textContent = document.getElementById('dateInput').value || '-';
  document.getElementById('reportOcr').textContent = ocrText.value.trim() || '인식된 텍스트가 없습니다.';
  const reportImage = document.getElementById('reportImage');
  const noImage = document.getElementById('noReportImage');
  if (currentImageUrl) {
    reportImage.src = currentImageUrl;
    reportImage.classList.remove('hidden');
    noImage.classList.add('hidden');
  } else {
    reportImage.classList.add('hidden');
    noImage.classList.remove('hidden');
  }
  document.getElementById('reportRisks').innerHTML = demoRisks.map(r =>
    `<div class="report-risk-row"><strong>${r.level} · ${r.title}</strong><div>${r.desc}</div></div>`
  ).join('');
}
['areaInput','inspectorInput','dateInput'].forEach(id => document.getElementById(id).addEventListener('input', updateReport));
ocrText.addEventListener('input', updateReport);

analyzeBtn.addEventListener('click', async () => {
  if (!currentFile) return;
  resultsPanel.classList.remove('hidden');
  progressWrap.classList.remove('hidden');
  analyzeBtn.disabled = true;
  ocrText.value = '';
  ocrStatus.textContent = 'OCR 엔진을 준비하고 있습니다...';
  try {
    if (window.Tesseract) {
      const result = await Tesseract.recognize(currentFile, 'kor+eng', {
        logger: m => {
          if (m.status) progressText.textContent = `OCR 처리 중: ${m.status}`;
          if (typeof m.progress === 'number') progressBar.style.width = `${Math.round(m.progress * 100)}%`;
        }
      });
      const recognized = (result.data.text || '').trim();
      ocrText.value = recognized || '텍스트를 인식하지 못했습니다. 사진에 문자가 있는지 확인하거나 내용을 직접 입력해 주세요.';
      ocrStatus.textContent = recognized ? `OCR 완료 · 신뢰도 ${Math.round(result.data.confidence || 0)}%` : 'OCR 완료 · 인식된 텍스트 없음';
    } else {
      ocrText.value = 'OCR 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
      ocrStatus.textContent = 'OCR 실행 실패';
    }
  } catch (err) {
    ocrText.value = 'OCR을 실행하지 못했습니다. 인터넷 연결을 확인하거나 사진 속 텍스트를 직접 입력해 주세요.';
    ocrStatus.textContent = 'OCR 오류';
  } finally {
    progressBar.style.width = '100%';
    progressText.textContent = '시연용 안전점검 예시 결과를 준비했습니다.';
    setTimeout(() => progressWrap.classList.add('hidden'), 1200);
    analyzeBtn.disabled = false;
    updateReport();
    resultsPanel.scrollIntoView({behavior:'smooth', block:'start'});
  }
});

document.getElementById('printBtn').addEventListener('click', () => {
  updateReport();
  window.print();
});
document.getElementById('resetBtn').addEventListener('click', () => {
  currentFile = null;
  if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
  currentImageUrl = '';
  photoInput.value = '';
  photoPreview.removeAttribute('src');
  previewWrap.classList.add('hidden');
  resultsPanel.classList.add('hidden');
  analyzeBtn.disabled = true;
  document.getElementById('areaInput').value = '';
  document.getElementById('inspectorInput').value = '';
  document.getElementById('dateInput').value = new Date().toISOString().slice(0,10);
  ocrText.value = '';
  window.scrollTo({top:0,behavior:'smooth'});
});
updateReport();
