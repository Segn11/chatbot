(async () => {
  const base = "http://localhost:5000/api/v1";
  const results = [];

  const record = (id, name, passed, details = "") => {
    results.push({ id, name, passed, details });
    const mark = passed ? "✅ PASS" : "❌ FAIL";
    console.log(`[${mark}] ${id}: ${name} ${details ? `(${details})` : ""}`);
  };

  console.log("==========================================================================");
  console.log("  CHATGPT-STYLE PERSISTENT CONVERSATION HISTORY TEST SUITE");
  console.log("==========================================================================\n");

  const ts = Date.now();
  let tokenUserA = null;
  let tokenUserB = null;
  let conv1Id = null;
  let conv2Id = null;

  // 1. Register User A
  try {
    const res = await fetch(`${base}/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-test-bypass-ratelimit": "true" },
      body: JSON.stringify({
        name: "Conversation Tester A",
        email: `tester_a_${ts}@testconv.com`,
        password: "Password123!",
      }),
    });
    const data = await res.json();
    tokenUserA = data.token;
    record("TC-HIST-01", "User A registration", res.status === 201 && !!tokenUserA, `Status: ${res.status}`);
  } catch (err) {
    record("TC-HIST-01", "User A registration", false, err.message);
  }

  // 2. Fetch conversations when empty
  try {
    const res = await fetch(`${base}/chat/conversations`, {
      headers: { Authorization: `Bearer ${tokenUserA}`, "x-test-bypass-ratelimit": "true" },
    });
    const data = await res.json();
    record(
      "TC-HIST-02",
      "Fetch initial conversations (empty)",
      res.status === 200 && Array.isArray(data.conversations) && data.conversations.length === 0,
      `Count: ${data.conversations?.length}`
    );
  } catch (err) {
    record("TC-HIST-02", "Fetch initial conversations", false, err.message);
  }

  // 3. Automatically create Conversation 1 on first message
  try {
    const res = await fetch(`${base}/chat/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
        "x-test-bypass-ratelimit": "true",
      },
      body: JSON.stringify({ message: "What is quantum computing?" }),
    });
    const data = await res.json();
    conv1Id = data.conversationId;
    record(
      "TC-HIST-03",
      "Auto-create Conversation 1 on first prompt",
      res.status === 200 && !!conv1Id && data.chats?.length === 2,
      `Conv ID: ${conv1Id}, Messages: ${data.chats?.length}`
    );
  } catch (err) {
    record("TC-HIST-03", "Auto-create Conversation 1", false, err.message);
  }

  // 4. Continue Conversation 1 with second prompt
  try {
    const res = await fetch(`${base}/chat/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
        "x-test-bypass-ratelimit": "true",
      },
      body: JSON.stringify({
        message: "Explain quantum superposition in simple terms.",
        conversationId: conv1Id,
      }),
    });
    const data = await res.json();
    record(
      "TC-HIST-04",
      "Continue Conversation 1 with conversationId",
      res.status === 200 && data.conversationId === conv1Id && data.chats?.length === 4,
      `Messages: ${data.chats?.length}`
    );
  } catch (err) {
    record("TC-HIST-04", "Continue Conversation 1", false, err.message);
  }

  // 5. Start a distinct new Conversation 2 (isNew: true)
  try {
    const res = await fetch(`${base}/chat/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
        "x-test-bypass-ratelimit": "true",
      },
      body: JSON.stringify({
        message: "Write a Python quicksort algorithm.",
        isNew: true,
      }),
    });
    const data = await res.json();
    conv2Id = data.conversationId;
    record(
      "TC-HIST-05",
      "Create distinct Conversation 2 (isNew: true)",
      res.status === 200 && !!conv2Id && conv2Id !== conv1Id && data.chats?.length === 2,
      `Conv 2 ID: ${conv2Id}, Messages: ${data.chats?.length}`
    );
  } catch (err) {
    record("TC-HIST-05", "Create distinct Conversation 2", false, err.message);
  }

  // 6. List conversations in sidebar format (sorted by updatedAt)
  try {
    const res = await fetch(`${base}/chat/conversations`, {
      headers: { Authorization: `Bearer ${tokenUserA}`, "x-test-bypass-ratelimit": "true" },
    });
    const data = await res.json();
    const isSorted =
      data.conversations?.length === 2 &&
      data.conversations[0]._id === conv2Id &&
      data.conversations[1]._id === conv1Id;

    record(
      "TC-HIST-06",
      "List conversations sorted newest first",
      res.status === 200 && isSorted,
      `Found ${data.conversations?.length} conversations, Top: "${data.conversations?.[0]?.title}"`
    );
  } catch (err) {
    record("TC-HIST-06", "List conversations", false, err.message);
  }

  // 7. Rename Conversation 2
  try {
    const newTitle = "Python Quicksort Implementation";
    const res = await fetch(`${base}/chat/conversation/${conv2Id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
        "x-test-bypass-ratelimit": "true",
      },
      body: JSON.stringify({ title: newTitle }),
    });
    const data = await res.json();
    record(
      "TC-HIST-07",
      "Rename conversation title",
      res.status === 200 && data.conversation?.title === newTitle,
      `Updated Title: "${data.conversation?.title}"`
    );
  } catch (err) {
    record("TC-HIST-07", "Rename conversation", false, err.message);
  }

  // 8. Open & retrieve conversation messages by ID
  try {
    const res = await fetch(`${base}/chat/conversation/${conv1Id}`, {
      headers: { Authorization: `Bearer ${tokenUserA}`, "x-test-bypass-ratelimit": "true" },
    });
    const data = await res.json();
    record(
      "TC-HIST-08",
      "Retrieve full conversation messages by ID",
      res.status === 200 && data.chats?.length === 4,
      `Retrieved ${data.chats?.length} messages for Conv 1`
    );
  } catch (err) {
    record("TC-HIST-08", "Retrieve conversation by ID", false, err.message);
  }

  // 9. Register User B & Test Strict Multi-Tenant Data Isolation
  try {
    const res = await fetch(`${base}/user/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-test-bypass-ratelimit": "true" },
      body: JSON.stringify({
        name: "Conversation Tester B",
        email: `tester_b_${ts}@testconv.com`,
        password: "Password123!",
      }),
    });
    const data = await res.json();
    tokenUserB = data.token;

    // User B lists conversations -> must be 0
    const bListRes = await fetch(`${base}/chat/conversations`, {
      headers: { Authorization: `Bearer ${tokenUserB}`, "x-test-bypass-ratelimit": "true" },
    });
    const bListData = await bListRes.json();
    const bListEmpty = bListRes.status === 200 && bListData.conversations?.length === 0;

    // User B attempts to access User A's Conversation 1 -> must be 404
    const bAccessRes = await fetch(`${base}/chat/conversation/${conv1Id}`, {
      headers: { Authorization: `Bearer ${tokenUserB}`, "x-test-bypass-ratelimit": "true" },
    });

    // User B attempts to rename User A's Conversation 1 -> must be 404
    const bRenameRes = await fetch(`${base}/chat/conversation/${conv1Id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserB}`,
        "x-test-bypass-ratelimit": "true",
      },
      body: JSON.stringify({ title: "Hacked Title" }),
    });

    // User B attempts to delete User A's Conversation 1 -> must be 404
    const bDeleteRes = await fetch(`${base}/chat/conversation/${conv1Id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenUserB}`, "x-test-bypass-ratelimit": "true" },
    });

    // User B attempts to post message to User A's Conversation 1 -> must be 404
    const bPostRes = await fetch(`${base}/chat/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserB}`,
        "x-test-bypass-ratelimit": "true",
      },
      body: JSON.stringify({
        message: "Injecting message into User A's chat",
        conversationId: conv1Id,
      }),
    });

    const isSecure =
      bListEmpty &&
      bAccessRes.status === 404 &&
      bRenameRes.status === 404 &&
      bDeleteRes.status === 404 &&
      bPostRes.status === 404;

    record(
      "TC-HIST-09",
      "Strict User Isolation (User B cannot read/rename/delete/post to User A)",
      isSecure,
      `B List: ${bListData.conversations?.length}, Read: ${bAccessRes.status}, Rename: ${bRenameRes.status}, Delete: ${bDeleteRes.status}, Post: ${bPostRes.status}`
    );
  } catch (err) {
    record("TC-HIST-09", "Strict User Isolation", false, err.message);
  }

  // 10. Delete a specific conversation (Conv 2)
  try {
    const res = await fetch(`${base}/chat/conversation/${conv2Id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenUserA}`, "x-test-bypass-ratelimit": "true" },
    });
    const verifyList = await fetch(`${base}/chat/conversations`, {
      headers: { Authorization: `Bearer ${tokenUserA}`, "x-test-bypass-ratelimit": "true" },
    });
    const listData = await verifyList.json();
    const remainingMatches = listData.conversations?.length === 1 && listData.conversations[0]._id === conv1Id;

    record(
      "TC-HIST-10",
      "Delete specific conversation session",
      res.status === 200 && remainingMatches,
      `Remaining conversations: ${listData.conversations?.length}`
    );
  } catch (err) {
    record("TC-HIST-10", "Delete specific conversation", false, err.message);
  }

  // 11. Clear all conversations
  try {
    const res = await fetch(`${base}/chat/delete`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenUserA}`, "x-test-bypass-ratelimit": "true" },
    });
    const verifyList = await fetch(`${base}/chat/conversations`, {
      headers: { Authorization: `Bearer ${tokenUserA}`, "x-test-bypass-ratelimit": "true" },
    });
    const listData = await verifyList.json();

    record(
      "TC-HIST-11",
      "Clear all conversations for user",
      res.status === 200 && listData.conversations?.length === 0,
      `Conversations remaining: ${listData.conversations?.length}`
    );
  } catch (err) {
    record("TC-HIST-11", "Clear all conversations", false, err.message);
  }

  // SUMMARY
  console.log("\n==========================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`Persistent History Tests Executed: ${total}`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

  process.exit(failed > 0 ? 1 : 0);
})();
