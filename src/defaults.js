// bảng màu nhóm: [màu đậm, nền pastel]
export const PAL = {
  red: ['#F0643C', '#FFE3D6'], brown: ['#B06A2C', '#F8E6D2'], blue: ['#3A7BEA', '#DCEAFF'], honey: ['#D99A06', '#FFF0C2'],
  purple: ['#8A4FE0', '#EFE3FF'], teal: ['#13A386', '#D5F5EE'], pink: ['#E5487A', '#FFE0EA'], green: ['#1FA463', '#DAF5E5'],
  indigo: ['#5B4FE0', '#E6E3FF'], orange: ['#E07B12', '#FFE9CF'],
};

export const LIB = {
  'Ăn uống': ["1f37d-fe0f", "1f373", "1f372", "1f371", "1f35c", "1f35d", "1f35b", "1f363", "1f364", "1f359", "1f35a", "1f95f", "1f956", "1f950", "1f96a", "1f354", "1f35f", "1f32d", "1f355", "1f32e", "1f957", "1f958", "1f362", "1f361", "1f366", "1f370", "1f382", "1f369", "1f36a", "1f36b", "1f36c", "1f37f", "1f964", "1f9cb", "2615", "1f375", "1f37a", "1f37b", "1f377", "1f942", "1f95b", "1f9c3", "1f965", "1f349", "1f34a", "1f34c", "1f34e", "1f96d", "1f347", "1f955", "1f966", "1f9c2", "1f9c8", "1f969", "1f357", "1f990", "1f41f"],
  'Đi lại': ["1f687", "1f68c", "1f695", "1f697", "1f3cd-fe0f", "1f6f5", "1f6b2", "1f686", "2708-fe0f", "1f6eb", "26fd", "1f17f-fe0f", "1f527", "1f6de", "1f9f3", "1f5fa-fe0f", "1f3d6-fe0f", "26f1-fe0f", "1f3d5-fe0f", "1f3ee", "1f5fc", "1f6a2", "1f6a6"],
  'Nhà cửa': ["1f3e0", "1f3e1", "1f3d8-fe0f", "1f3e2", "1f511", "1f6cf-fe0f", "1f6cb-fe0f", "1fa91", "1f6aa", "1f9f9", "1f9fa", "1f9fc", "1f9fb", "1faa3", "1f528", "1fa9b", "1f6e0-fe0f", "1f4a1", "26a1", "1f4a7", "1f525", "1f4fa", "1f310", "1f4f6", "1f4de", "1f4e6", "1f33f", "1fab4"],
  'Mua sắm': ["1f6cd-fe0f", "1f6d2", "1f455", "1f457", "1f456", "1f9e5", "1f45f", "1f460", "1f45c", "1f392", "1f453", "1f576-fe0f", "1f484", "1f48d", "231a", "1f4f1", "1f4bb", "1f5a5-fe0f", "2328-fe0f", "1f5b1-fe0f", "1f3a7", "1f4f7", "1f4bf", "1f9f8", "1f5bc-fe0f", "1f9e9", "1f4ce", "2702-fe0f", "1f9f4", "1f488"],
  'Giải trí': ["1f3ac", "1f37f", "1f3ae", "1f579-fe0f", "1f3b2", "1f3af", "1f3a4", "1f3a7", "1f3b8", "1f3a8", "1f58c-fe0f", "1f4da", "1f4d6", "1f393", "1f3ab", "1f39f-fe0f", "1f3ad", "1f3b3", "26bd", "1f3c0", "1f3f8", "1f3ca", "1f3cb-fe0f", "1f386", "1f389", "1f381", "25b6-fe0f"],
  'Sức khoẻ': ["1f3e5", "1f48a", "1fa7a", "1fa79", "1f489", "1f9b7", "1f9d8", "1f4aa", "1f3c3", "1f6e1-fe0f", "1f431", "1f436", "1f43e", "1f420", "1f331", "1f490"],
  'Người thân': ["1f46a", "1f476", "1f474", "1f475", "1f469", "1f468", "1f491", "1f497", "1f49d", "1f496", "2764-fe0f", "1f91d", "1f9e7", "1f381", "1f33e", "1f60a", "1f970"],
  'Tiền bạc': ["1f4b0", "1f4b5", "1f4b6", "1f4b7", "1f4b8", "1f4b3", "1fa99", "1f3e6", "1f4bc", "1f4c8", "1f4c9", "1f4ca", "1f9fe", "1f4dd", "1f4cb", "1f4e4", "1f4e5", "1f510", "2696-fe0f", "1f4b9", "1f437"],
};

// Cấu trúc nhóm mặc định = cấu trúc nhóm của Money Lover cũ.
// Mỗi dòng: id|tên|icon|màu|kiểu; dòng thụt vào là nhóm con của nhóm cha ngay phía trên.
export const STRUCT = `
an|Ăn uống|e:1f37d-fe0f|red
 an_sang|Ăn sáng|e:1f373|honey
 an_toi|Ăn tối|e:1f372|red
 an_trua|Ăn trưa|e:1f371|orange
 an_vatcty|ăn vặt trong cty|e:1f36c|pink
 an_bao|Bao ăn ún|e:1f354|teal
 an_cfsang|cafe sáng|e:2615|brown
 an_cftrua|cafe trưa|e:1f9cb|teal
 an_nglieu|nguyên liệu nấu ăn|e:1f955|orange
 an_dua|nước dừa|e:1f965|green
 an_onha|đồ ăn uống ở nhà|e:1f958|honey
anvk|ăn uống với K|e:1f377|pink
anvnha|Ăn uống với nhà|e:1f46a|honey
baoduong|Bảo dưỡng xe|e:1f527|blue
baohiem|Bảo hiểm|e:1f6e1-fe0f|teal
bibo|Bi Bo|e:1f431|orange
cpkhac2|Các chi phí khác|e:1f4e6|brown
cattoc|Cắt tóc, gội đầu|e:1f488|purple
codinh|Chi phí cố định cho nhà|e:1f3e0|honey
 luongcm|Lương cM|e:1f4b5|green
 thuenha|Thuê nhà|e:1f511|honey
 internet|Tiền internet|e:1f310|indigo
 nuoc|Tiền Nước|e:1f4a7|blue
 cap|Tiền truyền hình cáp|e:1f4fa|purple
 dien|Tiền điện|e:26a1|honey
 youtube|youtube|e:25b6-fe0f|red
cpkhac|Chi phí khác|e:1f9fe|orange
dichuyen|Di chuyển|e:1f687|blue
canhan|Đồ dùng cá nhân|e:1f392|purple
 chamsoc|chăm sóc cơ thể|e:1f9f4|pink
 decor|Decor PC|e:1f5bc-fe0f|honey
 dientu|Đồ điện tử|e:1f4f1|blue
 docty|đồ linh tinh trong cty|e:1f4ce|brown
 figure|Figure|e:1f9f8|pink
 game|Game gủng|e:1f3ae|teal
 pc|Linh kiện PC|e:1f5a5-fe0f|indigo
 linhtinh|Linh tinh|e:1f9e9|orange
 phanmem|Phần mềm|e:1f4bf|blue
 quanao|Quần áo|e:1f455|pink
xang|Đổ xăng|e:26fd|red
dulich|Du lịch|e:1f9f3|teal
 tq|Trung Quốc|e:1f3ee|red
 vungtau|Vũng Tàu|e:1f3d6-fe0f|blue
noan|ghi nợ An|e:1f4dd|orange
guixe|gửi xe|e:1f17f-fe0f|blue
ktrano|K trả nợ|e:1f91d|pink
 cdmuon|trả nợ cD mượn 20tr|e:1f4b8|green
kuan|ku An|e:1f476|teal
muasam|Mua sắm|e:1f6cd-fe0f|purple
outsource|Outsource|e:1f3a8|indigo
kphi|Phí tổng của K|e:1f497|pink
 kchi|Chi phí cho K|e:1f49d|pink
 kmuon|cho K mượn|e:1f4b6|teal
 kco|K bệnh cái cổ|e:1fa7a|blue
 kbenh|K bệnh linh tinh|e:1f48a|red
 kba|K cho ba|e:1f474|orange
 khoc|K học hành|e:1f393|indigo
 kmua|K mua đồ|e:1f6d2|purple
 klt|K phát sinh linh tinh|e:1f4cb|brown
 kque|K và quê K|e:1f33e|green
 ktro|tiền thuê trọ cho K|e:1f6cf-fe0f|honey
 kno|trả nợ cho K|e:1f45b|green
suanha|Sửa nhà|e:1f528|brown
suckhoe|Sức khỏe|e:1f3e5|red
tet|Tết|e:1f386|honey
 lixi|lì xì bên K|e:1f9e7|red
 tetk|tiền tết K|e:1fa99|honey
theduc|Thể dục thể thao|e:1f3c0|teal
chuyendi|Tiền chuyển đi|e:1f4e4|blue
dt3g|Tiền điện thoại, 3G|e:1f4f6|indigo
tragop|trả góp|e:1f4b3|brown
tralai|Trả lãi|e:1f4c9|orange
vequek|về quê K|e:1f3e1|green
phim|Xem phim|e:1f3ac|purple
dodung|Đồ dùng linh tinh trong nhà|e:1f6cb-fe0f|orange
 anvat|đồ ăn vặt|e:1f37f|honey
 giavi|Gia vị nấu ăn|e:1f9c2|brown
vayno|Vay, trả nợ|e:2696-fe0f|brown
 chovay|Cho vay|e:1f4b7|teal
 trano|Trả nợ|e:1f3e6|brown
luong|Lương|e:1f4bc|green|inc
thukhac|Thu nhập khác|e:1f4b0|teal|inc
job|Job|e:1f4bb|indigo|inc
lai|Thu lãi|e:1f4c8|honey|inc
chothue|tiền cho thuê nhà|e:1f3d8-fe0f|green|inc
ktra|K trả lại|e:1f496|pink|inc
antra|An trả lại|e:1f60a|teal|inc
kgiu|K đưa giữ dùm|e:1f510|brown|inc
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

// icon cũ (lucide) -> icon 3D tương ứng, dùng khi nâng cấp nhóm người dùng tự tạo
export const LUC2E = {"utensils-crossed": "1f37d-fe0f", "egg-fried": "1f373", "cooking-pot": "1f372", "sandwich": "1f371", "candy": "1f36c", "hand-platter": "1f354", "coffee": "2615", "cup-soda": "1f9cb", "carrot": "1f955", "tree-palm": "1f965", "chef-hat": "1f958", "wine": "1f377", "users": "1f46a", "wrench": "1f527", "shield-check": "1f6e1-fe0f", "cat": "1f431", "package": "1f4e6", "scissors": "1f488", "house": "1f3e0", "badge-dollar-sign": "1f4b5", "key-round": "1f511", "wifi": "1f310", "droplets": "1f4a7", "tv": "1f4fa", "zap": "26a1", "youtube": "25b6-fe0f", "receipt": "1f9fe", "bus": "1f687", "backpack": "1f392", "bath": "1f9f4", "lamp-desk": "1f5bc-fe0f", "smartphone": "1f4f1", "briefcase": "1f4ce", "person-standing": "1f9f8", "gamepad-2": "1f3ae", "cpu": "1f5a5-fe0f", "shapes": "1f9e9", "app-window": "1f4bf", "shirt": "1f455", "fuel": "26fd", "luggage": "1f9f3", "plane": "1f3ee", "waves": "1f3d6-fe0f", "notebook-pen": "1f4dd", "square-parking": "1f17f-fe0f", "handshake": "1f91d", "banknote": "1f4b8", "baby": "1f476", "shopping-bag": "1f6cd-fe0f", "brush": "1f3a8", "heart": "1f497", "heart-handshake": "1f49d", "hand-coins": "1f4b6", "stethoscope": "1fa7a", "pill": "1f48a", "gift": "1f474", "graduation-cap": "1f393", "shopping-cart": "1f6d2", "receipt-text": "1f4cb", "trees": "1f33e", "bed-double": "1f6cf-fe0f", "wallet": "1f45b", "hammer": "1f528", "heart-pulse": "1f3e5", "flower": "1f386", "mail": "1f9e7", "coins": "1fa99", "dumbbell": "1f3c0", "send": "1f4e4", "signal": "1f4f6", "calendar-clock": "1f4b3", "percent": "1f4c9", "map-pin-house": "1f3e1", "clapperboard": "1f3ac", "sofa": "1f6cb-fe0f", "popcorn": "1f37f", "wheat": "1f9c2", "scale": "2696-fe0f", "landmark": "1f3e6", "pen-tool": "1f4bb", "trending-up": "1f4c8", "house-plus": "1f3d8-fe0f", "undo-2": "1f496", "smile": "1f60a", "vault": "1f510", "utensils": "1f374", "soup": "1f35c", "beer": "1f37a", "milk": "1f95b", "cookie": "1f36a", "cake": "1f370", "ice-cream-cone": "1f366", "pizza": "1f355", "croissant": "1f950", "salad": "1f957", "apple": "1f34e", "fish": "1f41f", "drumstick": "1f357", "car": "1f697", "bike": "1f6b2", "car-taxi-front": "1f695", "train-front": "1f686", "plane-takeoff": "1f6eb", "tent": "1f3d5-fe0f", "umbrella": "26f1-fe0f", "map-pin": "1f5fa-fe0f", "bed": "1f6cf-fe0f", "lamp": "1f4a1", "droplet": "1f4a7", "flame": "1f525", "phone": "1f4de", "washing-machine": "1f9fa", "gem": "1f48d", "glasses": "1f453", "watch": "231a", "laptop": "1f4bb", "headphones": "1f3a7", "camera": "1f4f7", "film": "1f3ac", "music": "1f3b8", "ticket": "1f3ab", "party-popper": "1f389", "palette": "1f3a8", "book-open": "1f4d6", "sparkles": "1f389", "flower-2": "1f490", "sprout": "1f331", "dog": "1f436", "piggy-bank": "1f437", "credit-card": "1f4b3"};
