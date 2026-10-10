(function () {
  // Prevent multiple injections
  if (window.__RAG_WIDGET_INITIALIZED__) return;
  window.__RAG_WIDGET_INITIALIZED__ = true;

  // Find the script tag to get the data-kb-id attribute
  const scriptTag = document.currentScript || document.querySelector('script[src*="widget.js"]');
  const kbId = scriptTag ? scriptTag.getAttribute("data-kb-id") : null;
  
  if (!kbId) {
    console.error("[RAG Widget] No data-kb-id attribute found on the script tag.");
    return;
  }

  // Get base URL for iframe
  const srcUrl = new URL(scriptTag.src);
  const baseUrl = srcUrl.origin;
  const iframeUrl = `${baseUrl}/bot/${kbId}?widget=true`;

  // Create widget container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.bottom = "24px";
  container.style.right = "24px";
  container.style.zIndex = "999999";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "flex-end";
  container.style.fontFamily = "system-ui, -apple-system, sans-serif";

  // Create iframe wrapper (hidden by default)
  const iframeWrapper = document.createElement("div");
  iframeWrapper.style.display = "none";
  iframeWrapper.style.width = "400px";
  iframeWrapper.style.height = "650px";
  iframeWrapper.style.maxWidth = "calc(100vw - 48px)";
  iframeWrapper.style.maxHeight = "calc(100vh - 120px)";
  iframeWrapper.style.backgroundColor = "#020617"; // slate-950
  iframeWrapper.style.borderRadius = "16px";
  iframeWrapper.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.5)";
  iframeWrapper.style.overflow = "hidden";
  iframeWrapper.style.marginBottom = "16px";
  iframeWrapper.style.border = "1px solid rgba(30, 41, 59, 0.8)";
  iframeWrapper.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  iframeWrapper.style.opacity = "0";
  iframeWrapper.style.transform = "translateY(10px)";

  // Create iframe
  const iframe = document.createElement("iframe");
  iframe.src = iframeUrl;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.allow = "clipboard-write";
  iframeWrapper.appendChild(iframe);

  // Create toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.style.width = "60px";
  toggleBtn.style.height = "60px";
  toggleBtn.style.borderRadius = "30px";
  toggleBtn.style.backgroundColor = "#06b6d4"; // cyan-500
  toggleBtn.style.border = "none";
  toggleBtn.style.cursor = "pointer";
  toggleBtn.style.boxShadow = "0 10px 25px -5px rgba(6, 182, 212, 0.4)";
  toggleBtn.style.display = "flex";
  toggleBtn.style.alignItems = "center";
  toggleBtn.style.justifyContent = "center";
  toggleBtn.style.transition = "transform 0.2s ease, background-color 0.2s ease";
  toggleBtn.style.color = "#ffffff";
  
  // Try to get custom color if provided
  const customColor = scriptTag.getAttribute("data-color");
  if (customColor) {
    toggleBtn.style.backgroundColor = customColor;
    toggleBtn.style.boxShadow = `0 10px 25px -5px ${customColor}66`;
  }

  // Icons
  const chatIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
  const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

  toggleBtn.innerHTML = chatIcon;

  let isOpen = false;

  toggleBtn.addEventListener("mouseover", () => {
    toggleBtn.style.transform = "scale(1.05)";
  });
  toggleBtn.addEventListener("mouseout", () => {
    toggleBtn.style.transform = "scale(1)";
  });

  toggleBtn.addEventListener("click", () => {
    isOpen = !isOpen;
    if (isOpen) {
      iframeWrapper.style.display = "block";
      // Trigger reflow
      void iframeWrapper.offsetWidth;
      iframeWrapper.style.opacity = "1";
      iframeWrapper.style.transform = "translateY(0)";
      toggleBtn.innerHTML = closeIcon;
    } else {
      iframeWrapper.style.opacity = "0";
      iframeWrapper.style.transform = "translateY(10px)";
      setTimeout(() => {
        iframeWrapper.style.display = "none";
      }, 300);
      toggleBtn.innerHTML = chatIcon;
    }
  });

  // Append elements
  container.appendChild(iframeWrapper);
  container.appendChild(toggleBtn);
  document.body.appendChild(container);
})();
