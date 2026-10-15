// bảng màu nhóm: [màu đậm, nền pastel]
export const PAL = {
  red: ['#F0643C', '#FFE3D6'], brown: ['#B06A2C', '#F8E6D2'], blue: ['#3A7BEA', '#DCEAFF'], honey: ['#D99A06', '#FFF0C2'],
  purple: ['#8A4FE0', '#EFE3FF'], teal: ['#13A386', '#D5F5EE'], pink: ['#E5487A', '#FFE0EA'], green: ['#1FA463', '#DAF5E5'],
  indigo: ['#5B4FE0', '#E6E3FF'], orange: ['#E07B12', '#FFE9CF'],
};

export const LIB = {
  'Ăn uống': ['utensils-crossed', 'utensils', 'egg-fried', 'sandwich', 'cooking-pot', 'soup', 'coffee', 'cup-soda', 'wine', 'beer', 'milk', 'tree-palm', 'candy', 'popcorn', 'cookie', 'cake', 'ice-cream-cone', 'pizza', 'croissant', 'salad', 'carrot', 'apple', 'fish', 'drumstick', 'chef-hat', 'wheat', 'hand-platter'],
  'Đi lại': ['bus', 'car', 'bike', 'fuel', 'car-taxi-front', 'train-front', 'plane', 'plane-takeoff', 'luggage', 'waves', 'tent', 'umbrella', 'square-parking', 'wrench', 'map-pin', 'map-pin-house', 'trees'],
  'Nhà cửa': ['house', 'house-plus', 'key-round', 'bed-double', 'bed', 'sofa', 'lamp', 'hammer', 'zap', 'droplets', 'droplet', 'flame', 'wifi', 'tv', 'signal', 'phone', 'washing-machine', 'package'],
  'Mua sắm': ['shopping-bag', 'shopping-cart', 'backpack', 'shirt', 'gem', 'glasses', 'watch', 'scissors', 'bath', 'smartphone', 'laptop', 'cpu', 'lamp-desk', 'headphones', 'camera', 'app-window', 'person-standing', 'shapes', 'receipt', 'receipt-text'],
  'Giải trí': ['clapperboard', 'film', 'gamepad-2', 'youtube', 'music', 'ticket', 'party-popper', 'palette', 'brush', 'pen-tool', 'book-open', 'graduation-cap', 'sparkles'],
  'Sức khoẻ': ['heart-pulse', 'pill', 'stethoscope', 'dumbbell', 'shield-check', 'flower-2', 'sprout', 'baby', 'cat', 'dog', 'smile'],
  'Người thân': ['heart', 'heart-handshake', 'handshake', 'users', 'gift', 'flower', 'mail', 'coins'],
  'Tiền bạc': ['briefcase', 'wallet', 'banknote', 'badge-dollar-sign', 'hand-coins', 'piggy-bank', 'vault', 'landmark', 'scale', 'percent', 'trending-up', 'calendar-clock', 'credit-card', 'send', 'undo-2', 'notebook-pen'],
};

// Cấu trúc nhóm mặc định = cấu trúc nhóm của Money Lover cũ.
// Mỗi dòng: id|tên|icon|màu|kiểu; dòng thụt vào là nhóm con của nhóm cha ngay phía trên.
export const STRUCT = `
an|Ăn uống|utensils-crossed|red
 an_sang|Ăn sáng|egg-fried|honey
 an_toi|Ăn tối|cooking-pot|red
 an_trua|Ăn trưa|sandwich|orange
 an_vatcty|ăn vặt trong cty|candy|pink
 an_bao|Bao ăn ún|hand-platter|teal
 an_cfsang|cafe sáng|coffee|brown
 an_cftrua|cafe trưa|cup-soda|teal
 an_nglieu|nguyên liệu nấu ăn|carrot|orange
 an_dua|nước dừa|tree-palm|green
 an_onha|đồ ăn uống ở nhà|chef-hat|honey
anvk|ăn uống với K|wine|pink
anvnha|Ăn uống với nhà|users|honey
baoduong|Bảo dưỡng xe|wrench|blue
baohiem|Bảo hiểm|shield-check|teal
bibo|Bi Bo|cat|orange
cpkhac2|Các chi phí khác|package|brown
cattoc|Cắt tóc, gội đầu|scissors|purple
codinh|Chi phí cố định cho nhà|house|honey
 luongcm|Lương cM|badge-dollar-sign|green
 thuenha|Thuê nhà|key-round|honey
 internet|Tiền internet|wifi|indigo
 nuoc|Tiền Nước|droplets|blue
 cap|Tiền truyền hình cáp|tv|purple
 dien|Tiền điện|zap|honey
 youtube|youtube|youtube|red
cpkhac|Chi phí khác|receipt|orange
dichuyen|Di chuyển|bus|blue
canhan|Đồ dùng cá nhân|backpack|purple
 chamsoc|chăm sóc cơ thể|bath|pink
 decor|Decor PC|lamp-desk|honey
 dientu|Đồ điện tử|smartphone|blue
 docty|đồ linh tinh trong cty|briefcase|brown
 figure|Figure|person-standing|pink
 game|Game gủng|gamepad-2|teal
 pc|Linh kiện PC|cpu|indigo
 linhtinh|Linh tinh|shapes|orange
 phanmem|Phần mềm|app-window|blue
 quanao|Quần áo|shirt|pink
xang|Đổ xăng|fuel|red
dulich|Du lịch|luggage|teal
 tq|Trung Quốc|plane|red
 vungtau|Vũng Tàu|waves|blue
noan|ghi nợ An|notebook-pen|orange
guixe|gửi xe|square-parking|blue
ktrano|K trả nợ|handshake|pink
 cdmuon|trả nợ cD mượn 20tr|banknote|green
kuan|ku An|baby|teal
muasam|Mua sắm|shopping-bag|purple
outsource|Outsource|brush|indigo
kphi|Phí tổng của K|heart|pink
 kchi|Chi phí cho K|heart-handshake|pink
 kmuon|cho K mượn|hand-coins|teal
 kco|K bệnh cái cổ|stethoscope|blue
 kbenh|K bệnh linh tinh|pill|red
 kba|K cho ba|gift|orange
 khoc|K học hành|graduation-cap|indigo
 kmua|K mua đồ|shopping-cart|purple
 klt|K phát sinh linh tinh|receipt-text|brown
 kque|K và quê K|trees|green
 ktro|tiền thuê trọ cho K|bed-double|honey
 kno|trả nợ cho K|wallet|green
suanha|Sửa nhà|hammer|brown
suckhoe|Sức khỏe|heart-pulse|red
tet|Tết|flower|honey
 lixi|lì xì bên K|mail|red
 tetk|tiền tết K|coins|honey
theduc|Thể dục thể thao|dumbbell|teal
chuyendi|Tiền chuyển đi|send|blue
dt3g|Tiền điện thoại, 3G|signal|indigo
tragop|trả góp|calendar-clock|brown
tralai|Trả lãi|percent|orange
vequek|về quê K|map-pin-house|green
phim|Xem phim|clapperboard|purple
dodung|Đồ dùng linh tinh trong nhà|sofa|orange
 anvat|đồ ăn vặt|popcorn|honey
 giavi|Gia vị nấu ăn|wheat|brown
vayno|Vay, trả nợ|scale|brown
 chovay|Cho vay|hand-coins|teal
 trano|Trả nợ|landmark|brown
luong|Lương|briefcase|green|inc
thukhac|Thu nhập khác|wallet|teal|inc
job|Job|pen-tool|indigo|inc
lai|Thu lãi|trending-up|honey|inc
chothue|tiền cho thuê nhà|house-plus|green|inc
ktra|K trả lại|undo-2|pink|inc
antra|An trả lại|smile|teal|inc
kgiu|K đưa giữ dùm|vault|brown|inc
`;
export const DEFAULT_GROUPS = (() => {
  const out = [];
  let parent = null;
  for (const line of STRUCT.split('\n')) {
    if (!line.trim()) continue;
    const child = line.startsWith(' ');
    const [id, name, icon, color, type = 'exp'] = line.trim().split('|');
    const g = { id: 'ml_' + id, name, icon, color, type, parent: child ? parent : null, order: out.length };
    if (!child) parent = g.id;
    out.push(g);
  }
  return out;
})();

// nhóm của các bản cũ -> nhóm mới (dùng khi nâng cấp dữ liệu)
export const LEGACY = {
  g_an: 'ml_an', g_cf: 'ml_an_cfsang', g_ts: 'ml_an_cftrua', g_sang: 'ml_an_sang', g_di: 'ml_dichuyen', g_xang: 'ml_xang', g_grab: 'ml_dichuyen',
  g_nha: 'ml_codinh', g_dien: 'ml_dien', g_nuoc: 'ml_nuoc', g_net: 'ml_internet', g_mua: 'ml_muasam', g_art: 'ml_phanmem', g_ao: 'ml_quanao',
  g_gt: 'ml_cpkhac2', g_phim: 'ml_phim', g_sk: 'ml_suckhoe', g_thuoc: 'ml_suckhoe', g_pet: 'ml_bibo', g_hoc: 'ml_cpkhac2', g_qua: 'ml_cpkhac2', g_khac: 'ml_cpkhac2',
  g_luong: 'ml_luong', g_free: 'ml_job', g_thuong: 'ml_thukhac', g_duoctang: 'ml_thukhac', g_thukhac: 'ml_thukhac',
  mg_antrua: 'ml_an_trua', mg_antoi: 'ml_an_toi', mg_cafetrua: 'ml_an_cftrua', mg_nuocdua: 'ml_an_dua', mg_anvoinha: 'ml_anvnha', mg_baoan: 'ml_an_bao',
  mg_nauan: 'ml_an_onha', mg_anvat: 'ml_an_vatcty', mg_kchi: 'ml_kchi', mg_kan: 'ml_anvk', mg_klt: 'ml_klt', mg_kmuon: 'ml_kmuon', mg_kmua: 'ml_kmua',
  mg_kco: 'ml_kco', mg_kbenh: 'ml_kbenh', mg_kno: 'ml_kno', mg_khoc: 'ml_khoc', mg_kque: 'ml_kque', mg_ktro: 'ml_ktro', mg_kba: 'ml_kba', mg_ktet: 'ml_tetk',
  mg_kphi: 'ml_kphi', mg_baoduong: 'ml_baoduong', mg_guixe: 'ml_guixe', mg_thuenha: 'ml_thuenha', mg_cap: 'ml_cap', mg_codinh: 'ml_codinh', mg_suanha: 'ml_suanha',
  mg_dodung: 'ml_dodung', mg_canhan: 'ml_canhan', mg_dientu: 'ml_dientu', mg_pc: 'ml_pc', mg_decor: 'ml_decor', mg_figure: 'ml_figure', mg_tragop: 'ml_tragop',
  mg_game: 'ml_game', mg_youtube: 'ml_youtube', mg_dulich: 'ml_dulich', mg_vungtau: 'ml_vungtau', mg_tq: 'ml_tq', mg_theduc: 'ml_theduc', mg_cattoc: 'ml_cattoc',
  mg_chamsoc: 'ml_chamsoc', mg_baohiem: 'ml_baohiem', mg_bibo: 'ml_bibo', mg_tet: 'ml_tet', mg_outsource: 'ml_outsource', mg_luongcm: 'ml_luongcm', mg_docty: 'ml_docty',
  mg_chovay: 'ml_chovay', mg_trano: 'ml_trano', mg_noan: 'ml_noan', mg_linhtinh: 'ml_linhtinh', mg_cpkhac: 'ml_cpkhac', mg_lai: 'ml_lai', mg_chothue: 'ml_chothue',
  mg_ktra: 'ml_ktra', mg_antra: 'ml_antra', mg_kgiu: 'ml_kgiu', mg_k: 'ml_kphi', mg_work: 'ml_outsource', mg_debt: 'ml_vayno', mg_back: 'ml_thukhac',
};
