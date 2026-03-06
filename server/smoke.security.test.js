const { app } = require("./src/app");

// Tạo object lỗi kiểm thử có nhãn rõ ràng để trace nhanh bước bị fail.
function createAssertionError(message, context = {}) {
  const error = new Error(message);
  error.context = context;
  return error;
}

// Assert điều kiện test, ném lỗi ngay khi điều kiện không đạt.
function assert(condition, message, context = {}) {
  if (!condition) {
    throw createAssertionError(message, context);
  }
}

// Parse JSON an toàn để tránh crash khi API trả plain text hoặc empty body.
async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

// Gửi HTTP request tới API test server và trả cả status/payload để assert.
async function apiRequest(baseUrl, path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await parseJsonSafe(response);
  return { status: response.status, payload };
}

// Đăng nhập và trả access token để tái sử dụng cho các bước test tiếp theo.
async function login(baseUrl, email, password) {
  const result = await apiRequest(baseUrl, "/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

  assert(
    result.status === 200 && result.payload?.accessToken,
    `Login thất bại cho tài khoản ${email}`,
    result
  );

  return {
    token: result.payload.accessToken,
    user: result.payload.user,
  };
}

// Chạy toàn bộ security smoke test cho ACL records + doctor overview.
async function run() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    console.log("[QA-02] Bắt đầu security smoke test...");

    const patientAuth = await login(
      baseUrl,
      "patient.demo@picyourdoc.local",
      "Patient@123"
    );
    const doctorAuth = await login(
      baseUrl,
      "doctor.01@picyourdoc.local",
      "Doctor@123"
    );

    const doctorMe = await apiRequest(baseUrl, "/api/auth/me", {
      token: doctorAuth.token,
    });
    const doctorUser = doctorMe.payload?.data || doctorMe.payload?.user;
    assert(doctorMe.status === 200 && doctorUser?.id, "Không lấy được profile doctor /me", doctorMe);
    const doctorUserId = doctorUser.id;

    const familyRes = await apiRequest(baseUrl, "/api/records/family", {
      token: patientAuth.token,
    });
    assert(familyRes.status === 200, "Lấy family profile thất bại", familyRes);
    const primaryMember = familyRes.payload?.data?.members?.find((item) => item.isPrimary);
    assert(primaryMember?.id, "Không tìm thấy primary family member để test ACL", familyRes);
    const memberId = primaryMember.id;

    const marketplaceRes = await apiRequest(baseUrl, "/api/family-doctor/marketplace?limit=50", {
      token: patientAuth.token,
    });
    assert(marketplaceRes.status === 200, "Không lấy được family doctor marketplace", marketplaceRes);
    const matchedDoctor = (marketplaceRes.payload?.data || []).find(
      (item) => item.userId === doctorUserId
    );
    assert(matchedDoctor?.doctorId, "Không map được doctor profile từ tài khoản doctor.01", marketplaceRes);

    const doctorDetailRes = await apiRequest(baseUrl, `/api/doctors/${matchedDoctor.doctorId}`, {
      token: patientAuth.token,
    });
    assert(doctorDetailRes.status === 200, "Không lấy được doctor detail", doctorDetailRes);
    const firstSlot = doctorDetailRes.payload?.data?.availableSlots?.[0];
    assert(firstSlot?.id, "Không có slot để tạo appointment test", doctorDetailRes);

    const appointmentCreateRes = await apiRequest(baseUrl, "/api/appointments", {
      method: "POST",
      token: patientAuth.token,
      body: {
        doctorId: matchedDoctor.doctorId,
        slotId: firstSlot.id,
        reason: "Security ACL test",
      },
    });
    assert(appointmentCreateRes.status === 201, "Tạo appointment test thất bại", appointmentCreateRes);
    const appointmentId = appointmentCreateRes.payload?.data?.id;

    const confirmRes = await apiRequest(baseUrl, `/api/appointments/${appointmentId}/confirm`, {
      method: "PATCH",
      token: doctorAuth.token,
      body: {},
    });
    assert(confirmRes.status === 200, "Doctor confirm appointment test thất bại", confirmRes);

    const timelineCreateRes = await apiRequest(
      baseUrl,
      `/api/records/members/${memberId}/timeline`,
      {
        method: "POST",
        token: patientAuth.token,
        body: {
          entryType: "NOTE",
          title: "Ghi chú riêng tư QA-02",
          summary: "Bản ghi không gắn appointment để test one-time ACL.",
          sourceType: "PATIENT_MANUAL",
          customTags: ["qa02-private"],
        },
      }
    );
    assert(timelineCreateRes.status === 201, "Patient tạo timeline test thất bại", timelineCreateRes);
    const privateTimelineId = timelineCreateRes.payload?.data?.id;

    const oneTimeHealthProfileRes = await apiRequest(
      baseUrl,
      `/api/records/members/${memberId}/health-profile`,
      { token: doctorAuth.token }
    );
    assert(
      oneTimeHealthProfileRes.status === 403,
      "One-time doctor không được xem health profile full",
      oneTimeHealthProfileRes
    );

    const doctorOverviewRes = await apiRequest(
      baseUrl,
      `/api/doctors/patients/${memberId}/overview`,
      { token: doctorAuth.token }
    );
    assert(doctorOverviewRes.status === 200, "Doctor overview API lỗi", doctorOverviewRes);
    assert(
      doctorOverviewRes.payload?.data?.accessScope === "limited",
      "Doctor overview phải trả accessScope=limited cho one-time doctor",
      doctorOverviewRes
    );
    assert(
      doctorOverviewRes.payload?.data?.healthProfile === null,
      "One-time doctor không được nhận healthProfile đầy đủ từ doctor overview",
      doctorOverviewRes
    );

    const timelineBeforeShareRes = await apiRequest(
      baseUrl,
      `/api/records/members/${memberId}/timeline?limit=100`,
      { token: doctorAuth.token }
    );
    assert(timelineBeforeShareRes.status === 200, "Doctor lấy timeline trước khi share thất bại", timelineBeforeShareRes);
    const hasPrivateBeforeShare = (timelineBeforeShareRes.payload?.data || []).some(
      (item) => item.id === privateTimelineId
    );
    assert(!hasPrivateBeforeShare, "One-time doctor không được thấy bản ghi riêng tư trước khi share", timelineBeforeShareRes);

    const shareRes = await apiRequest(
      baseUrl,
      `/api/records/appointments/${appointmentId}/share`,
      {
        method: "POST",
        token: patientAuth.token,
        body: {
          timelineEntryIds: [privateTimelineId],
          scope: "TEMPORARY",
        },
      }
    );
    assert(shareRes.status === 201, "Patient share record cho appointment thất bại", shareRes);
    const sharedLinkId = shareRes.payload?.data?.[0]?.id;
    assert(sharedLinkId, "Không lấy được shared link id sau khi share", shareRes);

    const timelineAfterShareRes = await apiRequest(
      baseUrl,
      `/api/records/members/${memberId}/timeline?limit=100`,
      { token: doctorAuth.token }
    );
    assert(timelineAfterShareRes.status === 200, "Doctor lấy timeline sau khi share thất bại", timelineAfterShareRes);
    const hasPrivateAfterShare = (timelineAfterShareRes.payload?.data || []).some(
      (item) => item.id === privateTimelineId
    );
    assert(hasPrivateAfterShare, "Doctor phải thấy record sau khi patient share", timelineAfterShareRes);

    const revokeRes = await apiRequest(
      baseUrl,
      `/api/records/appointments/${appointmentId}/shared/${sharedLinkId}`,
      {
        method: "DELETE",
        token: patientAuth.token,
      }
    );
    assert(revokeRes.status === 200, "Patient revoke shared record thất bại", revokeRes);

    const timelineAfterRevokeRes = await apiRequest(
      baseUrl,
      `/api/records/members/${memberId}/timeline?limit=100`,
      { token: doctorAuth.token }
    );
    assert(timelineAfterRevokeRes.status === 200, "Doctor lấy timeline sau revoke thất bại", timelineAfterRevokeRes);
    const hasPrivateAfterRevoke = (timelineAfterRevokeRes.payload?.data || []).some(
      (item) => item.id === privateTimelineId
    );
    assert(!hasPrivateAfterRevoke, "Doctor phải mất quyền xem record sau khi patient revoke", timelineAfterRevokeRes);

    console.log("[QA-02] PASS - ACL records và doctor overview hoạt động đúng theo mô hình family doctor/one-time.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error("[QA-02] FAIL:", error.message);
  if (error.context) {
    console.error("[QA-02] Context:", JSON.stringify(error.context, null, 2));
  }
  process.exit(1);
});
