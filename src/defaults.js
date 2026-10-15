// bảng màu nhóm: [màu đậm, nền pastel]
export const PAL = {
  red: ['#F0643C', '#FFE3D6'], brown: ['#B06A2C', '#F8E6D2'], blue: ['#3A7BEA', '#DCEAFF'], honey: ['#D99A06', '#FFF0C2'],
  purple: ['#8A4FE0', '#EFE3FF'], teal: ['#13A386', '#D5F5EE'], pink: ['#E5487A', '#FFE0EA'], green: ['#1FA463', '#DAF5E5'],
  indigo: ['#5B4FE0', '#E6E3FF'], orange: ['#E07B12', '#FFE9CF'],
};

export const LIB = {
  'Ăn uống': ['utensils', 'coffee', 'cup-soda', 'pizza', 'sandwich', 'soup', 'ice-cream-cone', 'beer', 'cake', 'apple', 'cookie', 'egg-fried', 'croissant', 'salad', 'fish', 'drumstick', 'milk'],
  'Đi lại': ['car', 'bike', 'bus', 'fuel', 'train-front', 'plane', 'car-taxi-front', 'wrench', 'plane-takeoff'],
  'Nhà cửa': ['house', 'zap', 'droplet', 'wifi', 'flame', 'sofa', 'lamp', 'bed', 'washing-machine', 'key-round', 'phone'],
  'Mua sắm': ['shopping-bag', 'shopping-cart', 'shirt', 'gem', 'glasses', 'scissors', 'watch', 'smartphone', 'laptop', 'headphones', 'camera', 'receipt', 'credit-card'],
  'Giải trí': ['gamepad-2', 'film', 'music', 'ticket', 'tv', 'party-popper', 'palette', 'brush', 'pen-tool', 'book-open', 'graduation-cap', 'tent', 'umbrella'],
  'Sức khoẻ': ['heart-pulse', 'pill', 'stethoscope', 'dumbbell', 'baby', 'dog', 'cat', 'paw-print', 'sprout', 'flower-2', 'heart', 'users'],
  'Thu nhập': ['briefcase', 'wallet', 'banknote', 'piggy-bank', 'coins', 'gift', 'trending-up', 'hand-coins', 'landmark'],
};

// nhóm có sẵn khi mới dùng app
const D = (id, name, icon, color, type, parent) => ({ id, name, icon, color, type, parent: parent || null });
export const DEFAULT_GROUPS = [
  D('g_an', 'Ăn uống', 'utensils', 'red', 'exp'),
  D('g_cf', 'Cà phê', 'coffee', 'brown', 'exp', 'g_an'),
  D('g_ts', 'Trà sữa', 'cup-soda', 'pink', 'exp', 'g_an'),
  D('g_sang', 'Ăn sáng', 'soup', 'red', 'exp', 'g_an'),
  D('g_di', 'Đi lại', 'car', 'blue', 'exp'),
  D('g_xang', 'Xăng xe', 'fuel', 'blue', 'exp', 'g_di'),
  D('g_grab', 'Grab, taxi', 'car-taxi-front', 'teal', 'exp', 'g_di'),
  D('g_nha', 'Nhà cửa', 'house', 'honey', 'exp'),
  D('g_dien', 'Điện', 'zap', 'honey', 'exp', 'g_nha'),
  D('g_nuoc', 'Nước', 'droplet', 'blue', 'exp', 'g_nha'),
  D('g_net', 'Internet, điện thoại', 'wifi', 'indigo', 'exp', 'g_nha'),
  D('g_mua', 'Mua sắm', 'shopping-bag', 'purple', 'exp'),
  D('g_art', 'Đồ vẽ, phần mềm', 'palette', 'indigo', 'exp', 'g_mua'),
  D('g_ao', 'Quần áo', 'shirt', 'pink', 'exp', 'g_mua'),
  D('g_gt', 'Giải trí', 'gamepad-2', 'teal', 'exp'),
  D('g_phim', 'Xem phim', 'film', 'purple', 'exp', 'g_gt'),
  D('g_sk', 'Sức khoẻ', 'heart-pulse', 'pink', 'exp'),
  D('g_thuoc', 'Thuốc', 'pill', 'pink', 'exp', 'g_sk'),
  D('g_pet', 'Thú cưng', 'paw-print', 'orange', 'exp'),
  D('g_hoc', 'Học tập', 'book-open', 'indigo', 'exp'),
  D('g_qua', 'Quà, hiếu hỉ', 'gift', 'pink', 'exp'),
  D('g_khac', 'Khác', 'receipt', 'brown', 'exp'),
  D('g_luong', 'Lương', 'briefcase', 'green', 'inc'),
  D('g_free', 'Freelance', 'pen-tool', 'teal', 'inc'),
  D('g_thuong', 'Thưởng', 'coins', 'honey', 'inc'),
  D('g_duoctang', 'Được tặng', 'gift', 'pink', 'inc'),
  D('g_thukhac', 'Thu khác', 'wallet', 'green', 'inc'),
];
