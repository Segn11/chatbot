import puppeteer from "puppeteer-core";
import path from "path";

(async () => {
  const base = "http://localhost:5000/api/v1";
  const results = [];

  const record = (id, category, name, passed, details = "") => {
    results.push({ id, category, name, passed, details });
    const mark = passed ? "✅ PASS" : "❌ FAIL";
    console.log(`[${mark}] ${id}: ${name} ${details ? `(${details})` : ""}`);
  };

  console.log("===============================================================");
  console.log("  AI CHATBOT QA AUTOMATION TEST SUITE — BACKEND & API AUDIT");
  console.log("===============================================================\n");

  const testUserA = {
    name: "QA Tester Alpha",
    email: `qa_alpha_${Date.now()}@testqa.com`,
    password: "SecurePassword123!",
  };

  const testUserB = {
    name: "QA Tester Beta",
    email: `qa_beta_${Date.now()}@testqa.com`,
    password: "SecurePassword123!",
  };

  let tokenUserA = null;
  let tokenUserB = null;
  let cookieUserA = null;

  // --- SUITE 1: SYSTEM HEALTH ---
  try {
    const healthRes = await fetch("http://localhost:5000/health");
    const healthData = await healthRes.json();
    record(
      "TC-SYS-01",
      "System Health",
      "Healthcheck endpoint returns 200 and status healthy",
      healthRes.status === 200 && healthData.status === "healthy",
      `Status: ${healthRes.status}`
    );
  } catch (err) {
    record("TC-SYS-01", "System Health", "Healthcheck endpoint", false, err.message);
  }

  // --- SUITE 2: AUTHENTICATION & INPUT VALIDATION ---
  // TC-AUTH-01: Valid Signup
  try {
    const res = await fetch(`${base}/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUserA),
    });
    const data = await res.json();
    const setCookie = res.headers.get("set-cookie");
    tokenUserA = data.token;
    cookieUserA = setCookie ? setCookie.split(";")[0] : null;

    record(
      "TC-AUTH-01",
      "Authentication",
      "Register new user with valid credentials",
      res.status === 201 && typeof data.token === "string" && !!cookieUserA,
      `Status: ${res.status}, Token received: ${!!tokenUserA}`
    );
  } catch (err) {
    record("TC-AUTH-01", "Authentication", "Register new user", false, err.message);
  }

  // TC-AUTH-02: Duplicate Email
  try {
    const res = await fetch(`${base}/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUserA),
    });
    const data = await res.json();
    record(
      "TC-AUTH-02",
      "Authentication",
      "Reject signup with duplicate email",
      res.status === 401 && data.message === "User already registered",
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-AUTH-02", "Authentication", "Duplicate email", false, err.message);
  }

  // TC-AUTH-03: Password validation (< 6 chars)
  try {
    const res = await fetch(`${base}/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Short Pass", email: "short@qa.com", password: "123" }),
    });
    const data = await res.json();
    record(
      "TC-AUTH-03",
      "Input Validation",
      "Reject signup with password shorter than 6 characters",
      res.status === 422 && Array.isArray(data.errors),
      `Status: ${res.status}, Errors count: ${data.errors?.length}`
    );
  } catch (err) {
    record("TC-AUTH-03", "Input Validation", "Short password", false, err.message);
  }

  // TC-AUTH-04: Invalid email format
  try {
    const res = await fetch(`${base}/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Bad Email", email: "notanemail", password: "ValidPassword1!" }),
    });
    const data = await res.json();
    record(
      "TC-AUTH-04",
      "Input Validation",
      "Reject signup with invalid email format",
      res.status === 422 && Array.isArray(data.errors),
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-AUTH-04", "Input Validation", "Invalid email", false, err.message);
  }

  // TC-AUTH-05: Missing Name
  try {
    const res = await fetch(`${base}/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "noname@qa.com", password: "ValidPassword1!" }),
    });
    record(
      "TC-AUTH-05",
      "Input Validation",
      "Reject signup with missing required name field",
      res.status === 422,
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-AUTH-05", "Input Validation", "Missing name", false, err.message);
  }

  // TC-AUTH-06: Valid Login
  try {
    const res = await fetch(`${base}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUserA.email, password: testUserA.password }),
    });
    const data = await res.json();
    record(
      "TC-AUTH-06",
      "Authentication",
      "User login with valid credentials returns 200 + token",
      res.status === 200 && typeof data.token === "string" && data.email === testUserA.email,
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-AUTH-06", "Authentication", "Valid login", false, err.message);
  }

  // TC-AUTH-07: Login incorrect password
  try {
    const res = await fetch(`${base}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUserA.email, password: "WrongPassword999" }),
    });
    const data = await res.json();
    record(
      "TC-AUTH-07",
      "Authentication",
      "Reject login with incorrect password (403)",
      res.status === 403 && data.message === "Incorrect Password",
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-AUTH-07", "Authentication", "Incorrect password", false, err.message);
  }

  // TC-AUTH-08: Login non-existent email
  try {
    const res = await fetch(`${base}/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "doesnotexist999@testqa.com", password: "ValidPassword1!" }),
    });
    const data = await res.json();
    record(
      "TC-AUTH-08",
      "Authentication",
      "Reject login with non-existent email (401)",
      res.status === 401 && data.message === "User not registered",
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-AUTH-08", "Authentication", "Non-existent user", false, err.message);
  }

  // --- SUITE 3: SESSION SECURITY & TOKEN VERIFICATION ---
  // TC-AUTH-09: Auth status with Bearer Header
  try {
    const res = await fetch(`${base}/user/auth-status`, {
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    const data = await res.json();
    record(
      "TC-AUTH-09",
      "Session Security",
      "Verify session using Authorization: Bearer token header",
      res.status === 200 && data.email === testUserA.email,
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-AUTH-09", "Session Security", "Bearer token auth", false, err.message);
  }

  // TC-AUTH-10: Auth status with Cookie Only
  try {
    const res = await fetch(`${base}/user/auth-status`, {
      headers: { Cookie: cookieUserA },
    });
    const data = await res.json();
    record(
      "TC-AUTH-10",
      "Session Security",
      "Verify session using signed HTTP-only cookie fallback",
      res.status === 200 && data.email === testUserA.email,
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-AUTH-10", "Session Security", "Cookie auth", false, err.message);
  }

  // TC-AUTH-11: Tampered/Invalid Token
  try {
    const res = await fetch(`${base}/user/auth-status`, {
      headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.tampered" },
    });
    const data = await res.json();
    record(
      "TC-AUTH-11",
      "Session Security",
      "Reject tampered/forged JWT signature with 401",
      res.status === 401 && data.message === "Token Expired or Invalid",
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-AUTH-11", "Session Security", "Tampered token", false, err.message);
  }

  // TC-AUTH-12: Missing Token
  try {
    const res = await fetch(`${base}/user/auth-status`);
    const data = await res.json();
    record(
      "TC-AUTH-12",
      "Session Security",
      "Reject unauthenticated request with 401 Token Not Received",
      res.status === 401 && data.message === "Token Not Received",
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-AUTH-12", "Session Security", "Missing token", false, err.message);
  }

  // TC-AUTH-13: Logout
  try {
    const res = await fetch(`${base}/user/logout`);
    record(
      "TC-AUTH-13",
      "Session Security",
      "Logout clears session cookie and responds 200 OK",
      res.status === 200,
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-AUTH-13", "Session Security", "Logout", false, err.message);
  }

  // --- SUITE 4: CHAT ENGINE & CONVERSATION PERSISTENCE ---
  // TC-CHAT-01: First Chat Message
  try {
    const res = await fetch(`${base}/chat/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({ message: "What are microservices in software architecture?" }),
    });
    const data = await res.json();
    record(
      "TC-CHAT-01",
      "Chat Engine",
      "Send first chat prompt and receive AI response",
      res.status === 200 && data.chats?.length === 2 && data.chats[1].role === "assistant",
      `Message count: ${data.chats?.length}`
    );
  } catch (err) {
    record("TC-CHAT-01", "Chat Engine", "First chat", false, err.message);
  }

  // TC-CHAT-02: Multi-turn Chat Message
  try {
    const res = await fetch(`${base}/chat/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({ message: "Give me two pros and two cons of microservices." }),
    });
    const data = await res.json();
    record(
      "TC-CHAT-02",
      "Chat Engine",
      "Multi-turn conversation appends sequentially in history",
      res.status === 200 && data.chats?.length === 4,
      `Total messages: ${data.chats?.length}`
    );
  } catch (err) {
    record("TC-CHAT-02", "Chat Engine", "Multi-turn chat", false, err.message);
  }

  // TC-CHAT-03: Retrieve all chats
  try {
    const res = await fetch(`${base}/chat/all-chats`, {
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    const data = await res.json();
    record(
      "TC-CHAT-03",
      "Chat Engine",
      "Retrieve full persistent conversation history from database",
      res.status === 200 && data.chats?.length === 4,
      `Retrieved: ${data.chats?.length} messages`
    );
  } catch (err) {
    record("TC-CHAT-03", "Chat Engine", "Retrieve chats", false, err.message);
  }

  // TC-CHAT-04: Empty message validation
  try {
    const res = await fetch(`${base}/chat/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({ message: "" }),
    });
    record(
      "TC-CHAT-04",
      "Input Validation",
      "Reject empty chat prompt with 422 Unprocessable Entity",
      res.status === 422,
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-CHAT-04", "Input Validation", "Empty prompt", false, err.message);
  }

  // TC-CHAT-05: Chat without token
  try {
    const res = await fetch(`${base}/chat/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello without token" }),
    });
    record(
      "TC-CHAT-05",
      "Session Security",
      "Block unauthenticated chat requests with 401",
      res.status === 401,
      `Status: ${res.status}`
    );
  } catch (err) {
    record("TC-CHAT-05", "Session Security", "Chat without token", false, err.message);
  }

  // TC-CHAT-06: User Data Isolation Check
  try {
    // Register User B
    const bSignup = await fetch(`${base}/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUserB),
    });
    const bData = await bSignup.json();
    tokenUserB = bData.token;

    // Check User B's chats
    const bChats = await fetch(`${base}/chat/all-chats`, {
      headers: { Authorization: `Bearer ${tokenUserB}` },
    });
    const bChatsData = await bChats.json();

    record(
      "TC-CHAT-06",
      "Data Isolation",
      "User B has clean isolated history; cannot see User A chats",
      bChats.status === 200 && Array.isArray(bChatsData.chats) && bChatsData.chats.length === 0,
      `User B chats count: ${bChatsData.chats?.length} (User A has 4)`
    );
  } catch (err) {
    record("TC-CHAT-06", "Data Isolation", "User isolation", false, err.message);
  }

  // TC-CHAT-07: Clear chat history
  try {
    const res = await fetch(`${base}/chat/delete`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    const verifyRes = await fetch(`${base}/chat/all-chats`, {
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    const verifyData = await verifyRes.json();
    record(
      "TC-CHAT-07",
      "Chat Engine",
      "Clear chat history removes all messages for user",
      res.status === 200 && verifyData.chats?.length === 0,
      `Messages remaining: ${verifyData.chats?.length}`
    );
  } catch (err) {
    record("TC-CHAT-07", "Chat Engine", "Clear chats", false, err.message);
  }

  // --- SUITE 5: DATA SECURITY & CORS ---
  // TC-SEC-01: No plaintext passwords in API responses
  try {
    const allUsersRes = await fetch(`${base}/user`);
    const allUsersData = await allUsersRes.json();
    const passwordsExposed = allUsersData.users?.some(
      (u) => !u.password.startsWith("$2b$") && !u.password.startsWith("$2a$")
    );
    record(
      "TC-SEC-01",
      "Data Protection",
      "All stored passwords in DB are bcrypt salted hashes, never plaintext",
      !passwordsExposed,
      `Checked ${allUsersData.users?.length} accounts in DB`
    );
  } catch (err) {
    record("TC-SEC-01", "Data Protection", "Bcrypt hash check", false, err.message);
  }

  // TC-SEC-02: CORS Preflight
  try {
    const corsRes = await fetch(`${base}/chat/new`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://127.0.0.1:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
      },
    });
    const allowCred = corsRes.headers.get("access-control-allow-credentials");
    const allowOrigin = corsRes.headers.get("access-control-allow-origin");
    record(
      "TC-SEC-02",
      "CORS & Headers",
      "CORS preflight allows frontend origin with credentials and Authorization header",
      corsRes.status === 204 && allowCred === "true" && !!allowOrigin,
      `Status: ${corsRes.status}, Allowed origin: ${allowOrigin}`
    );
  } catch (err) {
    record("TC-SEC-02", "CORS & Headers", "CORS preflight", false, err.message);
  }

  console.log("\n===============================================================");
  console.log("  BACKEND API TEST SUITE SUMMARY");
  console.log("===============================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`Total Executed: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  // --- PHASE 2: AUTOMATED HEADLESS UI / END-TO-END BROWSER TEST ---
  console.log("===============================================================");
  console.log("  PHASE 2: AUTOMATED FRONTEND BROWSER E2E TEST (PUPPETEER)");
  console.log("===============================================================\n");

  const uiResults = [];
  const recordUI = (id, name, passed, details = "") => {
    uiResults.push({ id, name, passed, details });
    const mark = passed ? "✅ PASS" : "❌ FAIL";
    console.log(`[${mark}] ${id}: ${name} ${details ? `(${details})` : ""}`);
  };

  try {
    const browser = await puppeteer.launch({
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
      defaultViewport: { width: 1280, height: 800 },
    });

    const page = await browser.newPage();

    // TC-UI-01: Homepage Title and Branding
    await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle2" });
    const title = await page.title();
    const hasLogo = await page.$("img[alt='Chatbot Logo']");
    recordUI(
      "TC-UI-01",
      "Homepage renders brand logo and document title",
      title.includes("Chatbot") && !!hasLogo,
      `Title: "${title}"`
    );

    // TC-UI-02: Dark/Light Mode Theme Toggle
    const themeBtn = await page.$("button[title*='Mode']");
    const initialIsDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
    if (themeBtn) {
      await themeBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      const toggledIsDark = await page.evaluate(() =>
        document.documentElement.classList.contains("dark")
      );
      recordUI(
        "TC-UI-02",
        "Theme toggle switches between dark and light modes dynamically",
        initialIsDark !== toggledIsDark,
        `Initial dark: ${initialIsDark} -> Toggled dark: ${toggledIsDark}`
      );
    } else {
      recordUI("TC-UI-02", "Theme toggle", false, "Theme button not found");
    }

    // TC-UI-03: Route Guard Test (Unauthorized /chat redirect)
    await page.goto("http://127.0.0.1:5173/chat", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 600));
    const currentUrl = page.url();
    recordUI(
      "TC-UI-03",
      "Route guard redirects unauthenticated user from /chat to /login",
      currentUrl.includes("/login"),
      `Redirected to: ${currentUrl}`
    );

    // TC-UI-04: User Registration Flow
    await page.goto("http://127.0.0.1:5173/signup", { waitUntil: "networkidle2" });
    const uiUser = {
      name: "UI Automated QA",
      email: `ui_qa_${Date.now()}@testqa.com`,
      password: "TestPassword123!",
    };
    await page.type("#name", uiUser.name);
    await page.type("#email", uiUser.email);
    await page.type("#password", uiUser.password);
    await page.click("button[type='submit']");

    await page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));

    const postSignupUrl = page.url();
    recordUI(
      "TC-UI-04",
      "Signup form successfully registers and redirects user to /chat",
      postSignupUrl.includes("/chat"),
      `Post-signup URL: ${postSignupUrl}`
    );

    // TC-UI-05: Chat UI Input & Assistant Response
    const prompt = "What are three benefits of unit testing in software development?";
    await page.type("textarea", prompt);
    await page.click("button[aria-label='Send message']");

    // Wait for assistant response to render
    await new Promise((r) => setTimeout(r, 2500));
    const messageTexts = await page.$$eval(".prose", (nodes) => nodes.map((n) => n.textContent));
    const assistantReplied = messageTexts.length > 0 && messageTexts[0].length > 10;
    recordUI(
      "TC-UI-05",
      "Chat input sends prompt and renders AI response formatted in markdown",
      assistantReplied,
      `Assistant response received (${messageTexts[0]?.slice(0, 40)}...)`
    );

    // TC-UI-06: One-Click Copy Button
    const copyBtn = await page.$("button[title='Copy message']");
    recordUI(
      "TC-UI-06",
      "Assistant message displays one-click copy button",
      !!copyBtn,
      "Copy button rendered in assistant bubble"
    );

    // TC-UI-07: Sidebar Collapse Toggle
    const sidebarToggle = await page.$("button[aria-label='Toggle sidebar']");
    if (sidebarToggle) {
      await sidebarToggle.click();
      await new Promise((r) => setTimeout(r, 400));
      const sidebarHidden = await page.evaluate(() => {
        const aside = document.querySelector("aside");
        return aside && aside.classList.contains("-translate-x-full");
      });
      recordUI(
        "TC-UI-07",
        "Sidebar collapse/expand toggle controls drawer visibility",
        sidebarHidden,
        "Sidebar collapsed smoothly"
      );
    } else {
      recordUI("TC-UI-07", "Sidebar collapse toggle", false, "Toggle button not found");
    }

    // TC-UI-08: User Logout
    await page.goto("http://127.0.0.1:5173/chat", { waitUntil: "networkidle2" });
    const logoutBtn = await page.waitForSelector("button[title='Logout']", { timeout: 8000 }).catch(() => null);
    if (logoutBtn) {
      await logoutBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      const postLogoutUrl = page.url();
      recordUI(
        "TC-UI-08",
        "Logout button terminates session and navigates to /login",
        postLogoutUrl.includes("/login"),
        `Landed on: ${postLogoutUrl}`
      );
    } else {
      recordUI("TC-UI-08", "Logout button", false, "Logout button not found");
    }

    await browser.close();
  } catch (err) {
    recordUI("TC-UI-ERR", "Browser automation error", false, err.message);
  }

  console.log("\n===============================================================");
  console.log("  FRONTEND BROWSER TEST SUITE SUMMARY");
  console.log("===============================================================");
  const uiTotal = uiResults.length;
  const uiPassed = uiResults.filter((r) => r.passed).length;
  const uiFailed = uiTotal - uiPassed;
  console.log(`Total UI Tests: ${uiTotal} | Passed: ${uiPassed} | Failed: ${uiFailed}`);
  console.log(`Success Rate: ${((uiPassed / uiTotal) * 100).toFixed(1)}%\n`);

  process.exit(failed > 0 || uiFailed > 0 ? 1 : 0);
})();

