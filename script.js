// ==========================================
// 1. 基础数据与初始化
// ==========================================
const times = [
  "08:30", "09:20", "10:20", "11:10", "14:00", 
  "14:50", "15:40", "16:30", "19:00", "19:50"
];

const tbody = document.getElementById("timetable-body");
const modal = document.getElementById("modal");
const addBtn = document.getElementById("add-btn");
const cancelBtn = document.getElementById("cancel-btn");
const deleteBtn = document.getElementById("delete-btn");

// 数据从本地读取
let events = JSON.parse(localStorage.getItem("myTimetable")) || [];

// ==========================================
// 2. 绘制课表网格
// ==========================================
function renderGrid() {
  tbody.innerHTML = ""; 
  let merged = Array(times.length + 1).fill(null).map(() => Array(8).fill(false));

  for (let i = 0; i < times.length; i++) {
    const tr = document.createElement("tr");
    
    const timeTd = document.createElement("td");
    timeTd.className = "time-col";
    timeTd.innerHTML = `第${i + 1}节<br><small>${times[i]}</small>`;
    tr.appendChild(timeTd);

    for (let j = 1; j <= 7; j++) {
      if (merged[i + 1][j]) continue;

      const td = document.createElement("td");
      td.dataset.day = j;
      td.dataset.period = i + 1;
      
      renderEventInCell(td, j, i + 1, merged);
      
      // 点击空格子触发新增
      td.addEventListener("click", function(e) {
        if (e.target.classList.contains("event-block")) return; 
        openModal();
      });

      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

// ==========================================
// 3. 把事件画到格子里
// ==========================================
function renderEventInCell(td, day, period, merged) {
  const event = events.find(e => e.day == day && e.start == period);
  
  if (event) {
    const block = document.createElement("div");
    block.className = "event-block";
    
    block.style.backgroundColor = event.color || "#a8e6cf"; 
    block.classList.add(event.repeat ? "solid" : "dashed");
    
    block.innerHTML = `
      <div class="event-title">${event.repeat ? '' : '📌 '}${event.title}</div>
      <div class="event-loc">📍 ${event.location}</div>
    `;
    
    block.addEventListener("click", function(e) {
      e.stopPropagation(); 
      openModal(event);    
    });
    
    // 跨行合并
    if (event.duration > 1) {
      td.rowSpan = event.duration; 
      for (let k = 1; k < event.duration; k++) {
        if (period + k <= times.length) {
           merged[period + k][day] = true;
        }
      }
    }
    
    td.appendChild(block);
  }
}

// ==========================================
// 4. 弹窗与表单处理
// ==========================================
function openModal(eventToEdit = null) {
  modal.classList.remove("hidden");
  const form = document.getElementById("event-form");
  form.reset(); 
  
  if (eventToEdit) {
    deleteBtn.style.display = "inline-block";
    
    document.getElementById("event-id").value = eventToEdit.id;
    document.getElementById("event-title").value = eventToEdit.title;
    document.getElementById("event-day").value = eventToEdit.day;
    document.getElementById("event-start").value = eventToEdit.start;
    document.getElementById("event-duration").value = eventToEdit.duration;
    document.getElementById("event-location").value = eventToEdit.location;
    document.getElementById("event-repeat").checked = eventToEdit.repeat;
    document.getElementById("event-color").value = eventToEdit.color || "#d4a5a5";
  } else {
    deleteBtn.style.display = "none";
    document.getElementById("event-id").value = "";
  }
}

addBtn.addEventListener("click", () => openModal());
cancelBtn.addEventListener("click", () => modal.classList.add("hidden"));

// 表单提交（保存）
document.getElementById("event-form").addEventListener("submit", function(e) {
  e.preventDefault(); 

  const id = document.getElementById("event-id").value;
  
  const newEvent = {
    id: id || Date.now().toString(), 
    title: document.getElementById("event-title").value,
    day: parseInt(document.getElementById("event-day").value),
    start: parseInt(document.getElementById("event-start").value),
    duration: parseInt(document.getElementById("event-duration").value),
    location: document.getElementById("event-location").value || "未填写",
    repeat: document.getElementById("event-repeat").checked,
    color: document.getElementById("event-color").value
  };

  if (id) {
    events = events.filter(ev => ev.id !== id);
    events.push(newEvent);
  } else {
    events.push(newEvent);
  }
  
  // 存到本地
  localStorage.setItem("myTimetable", JSON.stringify(events));

  renderGrid();
  modal.classList.add("hidden");
});

// 删除按钮点击逻辑
deleteBtn.addEventListener("click", function() {
  const id = document.getElementById("event-id").value;
  if (id) {
    if (confirm("确定要删除这个事件吗？")) {
      events = events.filter(ev => ev.id !== id);
      localStorage.setItem("myTimetable", JSON.stringify(events));
      renderGrid();
      modal.classList.add("hidden");
    }
  }
});

// ==========================================
// 5. 数据导出与导入
// ==========================================
document.getElementById("export-btn").addEventListener("click", function() {
  const dataStr = JSON.stringify(events, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "我的课表备份.json";
  a.click();
  URL.revokeObjectURL(url); 
});

document.getElementById("import-btn").addEventListener("click", function() {
  document.getElementById("file-input").click(); 
});

document.getElementById("file-input").addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const importedData = JSON.parse(event.target.result);
      if (Array.isArray(importedData)) {
        events = events.concat(importedData);
        localStorage.setItem("myTimetable", JSON.stringify(events));
        renderGrid();
        alert("导入成功！");
      } else {
        alert("文件格式不正确");
      }
    } catch (err) {
      alert("解析失败，请确保是有效的 JSON 文件");
    }
  };
  reader.readAsText(file);
  e.target.value = ""; 
});

// 启动！
renderGrid();