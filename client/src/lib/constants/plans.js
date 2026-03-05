// Khai báo quyền lợi hiển thị trên FE để disable UI sớm trước khi gọi API.
const PLAN_RIGHTS = {
  FREE: {
    consultSessionQuota: 0,
    familyMemberLimit: 1,
    canConsult: false,
    label: "Free",
  },
  PREMIUM: {
    consultSessionQuota: 4,
    familyMemberLimit: 2,
    canConsult: true,
    label: "Premium",
  },
  FAMILY: {
    consultSessionQuota: 12,
    familyMemberLimit: 6,
    canConsult: true,
    label: "Family",
  },
};

export { PLAN_RIGHTS };
