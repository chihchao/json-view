const jsonInput = document.getElementById("jsonInput");
const statusText = document.getElementById("status");
const jsonPreview = document.getElementById("jsonPreview");

const validateBtn = document.getElementById("validateBtn");
const prettyBtn = document.getElementById("prettyBtn");
const minifyBtn = document.getElementById("minifyBtn");
const copyBtn = document.getElementById("copyBtn");
const uploadBtn = document.getElementById("uploadBtn");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");
const fileInput = document.getElementById("fileInput");

let typingTimer = null;

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function syntaxHighlight(jsonText) {
  const escaped = escapeHtml(jsonText);

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let tokenClass = "json-number";

      if (match.startsWith('"')) {
        tokenClass = match.endsWith(":") ? "json-key" : "json-string";
      } else if (match === "true" || match === "false") {
        tokenClass = "json-boolean";
      } else if (match === "null") {
        tokenClass = "json-null";
      }

      return `<span class="${tokenClass}">${match}</span>`;
    }
  );
}

function setPreviewEmpty() {
  jsonPreview.classList.add("empty");
  jsonPreview.textContent = "尚無可預覽內容";
}

function renderPreview(text) {
  jsonPreview.classList.remove("empty");
  jsonPreview.innerHTML = syntaxHighlight(text);
}

function parseJsonText(source, { silent = false } = {}) {
  const trimmed = source.trim();

  if (!trimmed) {
    if (!silent) {
      showStatus("請先貼上 JSON 內容。", "error");
    }
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (!silent) {
      showStatus("JSON 格式正確。", "ok");
    }
    return parsed;
  } catch (error) {
    if (!silent) {
      showStatus(`JSON 格式錯誤：${error.message}`, "error");
    }
    return null;
  }
}

function showStatus(message, type) {
  statusText.textContent = message;
  statusText.className = `status ${type}`;
}

function parseJsonInput() {
  const source = jsonInput.value;
  const parsed = parseJsonText(source);

  if (parsed === null) {
    setPreviewEmpty();
    return null;
  }

  renderPreview(JSON.stringify(parsed, null, 2));
  return parsed;
}

validateBtn.addEventListener("click", () => {
  parseJsonInput();
});

prettyBtn.addEventListener("click", () => {
  const parsed = parseJsonInput();
  if (parsed === null) {
    return;
  }

  jsonInput.value = JSON.stringify(parsed, null, 2);
  renderPreview(jsonInput.value);
  showStatus("已完成縮排排版。", "ok");
});

minifyBtn.addEventListener("click", () => {
  const parsed = parseJsonInput();
  if (parsed === null) {
    return;
  }

  jsonInput.value = JSON.stringify(parsed);
  renderPreview(jsonInput.value);
  showStatus("已壓縮為單行 JSON。", "ok");
});

copyBtn.addEventListener("click", async () => {
  const text = jsonInput.value;

  if (!text.trim()) {
    showStatus("沒有可複製的內容。", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showStatus("已複製到剪貼簿。", "ok");
  } catch {
    showStatus("複製失敗，請確認瀏覽器權限。", "error");
  }
});

uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];

  if (!file) {
    return;
  }

  try {
    const fileText = await file.text();
    const parsed = parseJsonText(fileText);

    if (parsed === null) {
      setPreviewEmpty();
      return;
    }

    jsonInput.value = JSON.stringify(parsed, null, 2);
    renderPreview(jsonInput.value);
    showStatus(`已載入檔案：${file.name}`, "ok");
  } finally {
    fileInput.value = "";
  }
});

downloadBtn.addEventListener("click", () => {
  const parsed = parseJsonInput();
  if (parsed === null) {
    return;
  }

  const prettyText = JSON.stringify(parsed, null, 2);
  const blob = new Blob([prettyText], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "formatted.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showStatus("已下載排版 JSON。", "ok");
});

clearBtn.addEventListener("click", () => {
  jsonInput.value = "";
  showStatus("已清空內容。", "ok");
  setPreviewEmpty();
  jsonInput.focus();
});

jsonInput.addEventListener("input", () => {
  const source = jsonInput.value;

  if (!source.trim()) {
    setPreviewEmpty();
    statusText.textContent = "";
    statusText.className = "status";
    return;
  }

  if (typingTimer) {
    clearTimeout(typingTimer);
  }

  typingTimer = setTimeout(() => {
    const parsed = parseJsonText(source, { silent: true });

    if (parsed === null) {
      showStatus("即時驗證：格式錯誤。", "error");
      setPreviewEmpty();
      return;
    }

    showStatus("即時驗證：格式正確。", "ok");
    renderPreview(JSON.stringify(parsed, null, 2));
  }, 220);
});

setPreviewEmpty();
