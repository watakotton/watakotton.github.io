const supabaseClient = supabase.createClient(
  "https://kfyyxcexnmgdlfxhmjal.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeXl4Y2V4bm1nZGxmeGhtamFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5Mjk2NjksImV4cCI6MjA5MTUwNTY2OX0.Xv4jVI0bmyMMLo9aws6OUdgkLYx6pWMK_Qc8mGMZvzE",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);

// 要素を取得
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");

// タスク追加
addBtn.addEventListener("click", async () => {
  const text = taskInput.value.trim();
  if (text === "") return;

  const user = (await supabaseClient.auth.getUser()).data.user;

  const { data, error } = await supabaseClient
    .from("tasks")
    .insert({
      text: text,
      done: false,
      user_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  addTaskToUI(data.id, data.text, data.done);
  taskInput.value = "";
});

// UI にタスクを追加
function addTaskToUI(id, text, done) {
  const li = document.createElement("li");

  const span = document.createElement("span");
  span.textContent = text;

  const checkBtn = document.createElement("button");
  checkBtn.textContent = "✔";
  checkBtn.style.marginRight = "10px";

  checkBtn.addEventListener("click", async () => {
    li.classList.toggle("done");
    const newDone = li.classList.contains("done");

    await supabaseClient
      .from("tasks")
      .update({ done: newDone })
      .eq("id", id);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "🗑";

  deleteBtn.addEventListener("click", async () => {
    li.remove();

    await supabaseClient
      .from("tasks")
      .delete()
      .eq("id", id);
  });

  if (done) {
    li.classList.add("done");
  }

  li.appendChild(checkBtn);
  li.appendChild(span);
  li.appendChild(deleteBtn);

  taskList.appendChild(li);
}

// 初期読み込み
async function initializeTasks() {
  const user = (await supabaseClient.auth.getUser()).data.user;

  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    return;
  }

  taskList.innerHTML = "";
  data.forEach(task => {
    addTaskToUI(task.id, task.text, task.done);
  });
}

// 新規登録
document.getElementById("signupBtn").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) alert(error.message);
  else alert("登録完了！");
};

// メールログイン
document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) alert(error.message);
  else {
    alert("ログイン成功！");
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    initializeTasks();
  }
};

// ログアウト
document.getElementById("logoutBtn").onclick = async () => {
  await supabaseClient.auth.signOut();
  location.reload();
};

// Google ログイン
document.getElementById("googleLoginBtn").onclick = async () => {
  await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  });
};

// ページ読み込み時にログイン状態を確認
supabaseClient.auth.getSession().then(({ data }) => {
  if (data.session) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    initializeTasks();
  }
});