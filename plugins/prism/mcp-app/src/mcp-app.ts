import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";

interface PrData {
  id: string;
  title: string;
  status: string;
  dependsOn: string[];
  wave?: string;
  description?: string;
  url?: string;
  risk?: string;
}

interface TaskData {
  title: string;
  done: boolean;
  linkedPr?: string;
}

interface PrismData {
  refreshSeconds?: number;
  prs: PrData[];
  tasks?: TaskData[];
  error?: string;
}

const progressEl = document.getElementById("progress")!;
const rootEl = document.getElementById("root")!;

const app = new App({ name: "PRism", version: "1.0.0" });
app.connect(new PostMessageTransport(window.parent));

function renderBadge(cls: string, text: string): string {
  return `<span class="badge badge-${cls}">${text}</span>`;
}

function renderProgress(prs: PrData[]): string {
  const total = prs.length;
  const done = prs.filter((p) => p.status === "done").length;
  const inProgress = prs.filter((p) => p.status === "in-progress").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="progress-container">
    <div class="progress-stats">
      <span>${done} of ${total} PRs completed${inProgress ? ` &middot; ${inProgress} in progress` : ""}</span>
      <span>${pct}%</span>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
  </div>`;
}

function renderViewPrButton(url?: string): string {
  if (!url) return "";
  return `<div class="pr-actions"><a class="btn-view-pr" href="${url}" target="_blank" rel="noopener">
    <svg viewBox="0 0 16 16"><path d="M8 0a8 8 0 110 16A8 8 0 018 0zm.75 4.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z"/></svg>
    View PR</a></div>`;
}

function groupByWave(prs: PrData[]): Map<string, PrData[]> {
  const waves = new Map<string, PrData[]>();
  for (const pr of prs) {
    const w = pr.wave || "Ungrouped";
    if (!waves.has(w)) waves.set(w, []);
    waves.get(w)!.push(pr);
  }
  return waves;
}

function render(data: PrismData): void {
  if (data.error) {
    rootEl.innerHTML = `<div class="error">${data.error}</div>`;
    progressEl.innerHTML = "";
    return;
  }

  const waves = groupByWave(data.prs);
  progressEl.innerHTML = renderProgress(data.prs);

  let html = '<div class="waves">';
  for (const [waveName, prs] of waves) {
    html += `<div class="wave"><div class="wave-title">${waveName}</div>`;
    for (const pr of prs) {
      const statusCls = pr.status.replace(/\s+/g, "-");
      const riskBadge = pr.risk
        ? renderBadge("risk-" + pr.risk.toLowerCase(), pr.risk + " risk")
        : "";
      const deps = pr.dependsOn.length
        ? `<div class="deps">Depends on: ${pr.dependsOn.join(", ")}</div>`
        : "";
      const desc = pr.description
        ? `<div class="pr-meta">${pr.description}</div>`
        : "";
      const prBtn = renderViewPrButton(pr.url);
      html += `<div class="pr-card status-${statusCls}">
        <div class="pr-id">${pr.id} ${renderBadge(statusCls, pr.status)} ${riskBadge}</div>
        <div class="pr-title">${pr.title}</div>
        ${desc}${deps}${prBtn}
      </div>`;
    }
    html += "</div>";
  }
  html += "</div>";

  if (data.tasks?.length) {
    html += '<div class="tasks-section"><h2>Tasks</h2>';
    for (const t of data.tasks) {
      const cls = t.done ? "task task-done" : "task";
      const check = t.done ? "&#9745;" : "&#9744;";
      const link = t.linkedPr ? ` (${t.linkedPr})` : "";
      html += `<div class="${cls}">${check} ${t.title}${link}</div>`;
    }
    html += "</div>";
  }

  rootEl.innerHTML = html;
}

// Handle the initial tool result pushed by the host
app.ontoolresult = (result) => {
  const textContent = result.content?.find(
    (c: { type: string }) => c.type === "text",
  );
  const text = textContent && "text" in textContent ? textContent.text : undefined;
  if (!text) {
    rootEl.innerHTML = '<div class="error">No data received</div>';
    return;
  }
  try {
    const data: PrismData = JSON.parse(text);
    render(data);
  } catch {
    rootEl.innerHTML = '<div class="error">Failed to parse PR data</div>';
  }
};
