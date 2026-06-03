// Store.js - Quản lý Dữ liệu và Trạng thái cho ứng dụng Tài chính Gia đình

(function() {
    const STORAGE_KEY = 'family_finance_data_v1';

    // Định nghĩa các danh mục mặc định
    const DEFAULT_CATEGORIES = {
        income: ["Lương", "Thưởng", "Kinh doanh", "Đầu tư", "Khác"],
        expense: ["Ăn uống", "Di chuyển", "Hóa đơn", "Giáo dục", "Sức khỏe", "Mua sắm", "Giải trí", "Tiết kiệm", "Khác"]
    };

    const DEFAULT_MEMBERS = ["Bố", "Mẹ", "Con Cả", "Con Út"];
    const DEFAULT_ACCOUNTS = ["Tài khoản ngân hàng", "Ví tiền mặt", "Thẻ tín dụng"];

    // Danh mục Icon tương ứng để hiển thị đẹp mắt
    const CATEGORY_ICONS = {
        "Lương": "fa-wallet",
        "Thưởng": "fa-gift",
        "Kinh doanh": "fa-briefcase",
        "Đầu tư": "fa-chart-line",
        "Ăn uống": "fa-utensils",
        "Di chuyển": "fa-car",
        "Hóa đơn": "fa-file-invoice-dollar",
        "Giáo dục": "fa-graduation-cap",
        "Sức khỏe": "fa-heartbeat",
        "Mua sắm": "fa-shopping-bag",
        "Giải trí": "fa-gamepad",
        "Tiết kiệm": "fa-piggy-bank",
        "Khác": "fa-ellipsis-h"
    };

    // Danh mục màu sắc tương ứng (màu HSL sang trọng cho Dark Mode)
    const CATEGORY_COLORS = {
        "Lương": "hsl(142, 70%, 45%)", // Emerald
        "Thưởng": "hsl(328, 90%, 55%)", // Pink
        "Kinh doanh": "hsl(217, 91%, 60%)", // Blue
        "Đầu tư": "hsl(187, 92%, 40%)", // Cyan
        "Ăn uống": "hsl(24, 95%, 55%)", // Orange
        "Di chuyển": "hsl(200, 95%, 45%)", // Sky Blue
        "Hóa đơn": "hsl(0, 84%, 60%)", // Coral Red
        "Giáo dục": "hsl(262, 83%, 58%)", // Purple
        "Sức khỏe": "hsl(350, 89%, 60%)", // Rose
        "Mua sắm": "hsl(43, 96%, 50%)", // Amber
        "Giải trí": "hsl(292, 84%, 60%)", // Magenta
        "Tiết kiệm": "hsl(150, 60%, 40%)", // Sage Green
        "Khác": "hsl(215, 16%, 47%)" // Slate Grey
    };

    // Dữ liệu mẫu khởi tạo lần đầu
    function getMockData() {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const lastM = String(today.getMonth() === 0 ? 12 : today.getMonth()).padStart(2, '0');
        const lastMY = today.getMonth() === 0 ? y - 1 : y;

        return {
            transactions: [
                // Tháng này
                {
                    id: 't-1',
                    type: 'income',
                    amount: 25000000,
                    date: `${y}-${m}-01`,
                    category: 'Lương',
                    member: 'Bố',
                    account: 'Tài khoản ngân hàng',
                    notes: 'Lương chuyển khoản công ty'
                },
                {
                    id: 't-2',
                    type: 'income',
                    amount: 18000000,
                    date: `${y}-${m}-01`,
                    category: 'Lương',
                    member: 'Mẹ',
                    account: 'Tài khoản ngân hàng',
                    notes: 'Lương hàng tháng'
                },
                {
                    id: 't-3',
                    type: 'expense',
                    amount: 5000000,
                    date: `${y}-${m}-01`,
                    category: 'Hóa đơn',
                    member: 'Bố',
                    account: 'Tài khoản ngân hàng',
                    notes: 'Tiền đóng phí chung cư & điện nước'
                },
                {
                    id: 't-4',
                    type: 'expense',
                    amount: 950000,
                    date: `${y}-${m}-02`,
                    category: 'Ăn uống',
                    member: 'Mẹ',
                    account: 'Thẻ tín dụng',
                    notes: 'Đi siêu thị mua đồ ăn tuần mới'
                },
                {
                    id: 't-5',
                    type: 'expense',
                    amount: 800000,
                    date: `${y}-${m}-03`,
                    category: 'Di chuyển',
                    member: 'Bố',
                    account: 'Thẻ tín dụng',
                    notes: 'Đổ xăng ô tô'
                },
                
                // Tháng trước
                {
                    id: 't-6',
                    type: 'income',
                    amount: 25000000,
                    date: `${lastMY}-${lastM}-05`,
                    category: 'Lương',
                    member: 'Bố',
                    account: 'Tài khoản ngân hàng',
                    notes: 'Lương tháng trước'
                },
                {
                    id: 't-7',
                    type: 'income',
                    amount: 18000000,
                    date: `${lastMY}-${lastM}-05`,
                    category: 'Lương',
                    member: 'Mẹ',
                    account: 'Tài khoản ngân hàng',
                    notes: 'Lương tháng trước'
                },
                {
                    id: 't-8',
                    type: 'income',
                    amount: 5000000,
                    date: `${lastMY}-${lastM}-15`,
                    category: 'Thưởng',
                    member: 'Bố',
                    account: 'Tài khoản ngân hàng',
                    notes: 'Thưởng dự án xuất sắc'
                },
                {
                    id: 't-9',
                    type: 'expense',
                    amount: 4500000,
                    date: `${lastMY}-${lastM}-06`,
                    category: 'Ăn uống',
                    member: 'Mẹ',
                    account: 'Ví tiền mặt',
                    notes: 'Tiền đi chợ nấu ăn cả tháng'
                },
                {
                    id: 't-10',
                    type: 'expense',
                    amount: 1800000,
                    date: `${lastMY}-${lastM}-08`,
                    category: 'Hóa đơn',
                    member: 'Bố',
                    account: 'Tài khoản ngân hàng',
                    notes: 'Thanh toán tiền Internet & Truyền hình'
                },
                {
                    id: 't-11',
                    type: 'expense',
                    amount: 3500000,
                    date: `${lastMY}-${lastM}-10`,
                    category: 'Giáo dục',
                    member: 'Mẹ',
                    account: 'Tài khoản ngân hàng',
                    notes: 'Học phí học tiếng Anh của con cả'
                },
                {
                    id: 't-12',
                    type: 'expense',
                    amount: 1200000,
                    date: `${lastMY}-${lastM}-12`,
                    category: 'Mua sắm',
                    member: 'Mẹ',
                    account: 'Thẻ tín dụng',
                    notes: 'Mua đồ gia dụng phòng bếp'
                },
                {
                    id: 't-13',
                    type: 'expense',
                    amount: 600000,
                    date: `${lastMY}-${lastM}-15`,
                    category: 'Sức khỏe',
                    member: 'Bố',
                    account: 'Ví tiền mặt',
                    notes: 'Khám răng định kỳ'
                },
                {
                    id: 't-14',
                    type: 'expense',
                    amount: 1500000,
                    date: `${lastMY}-${lastM}-18`,
                    category: 'Giải trí',
                    member: 'Bố',
                    account: 'Thẻ tín dụng',
                    notes: 'Cả nhà đi ăn buffet cuối tuần'
                },
                {
                    id: 't-15',
                    type: 'expense',
                    amount: 200000,
                    date: `${lastMY}-${lastM}-22`,
                    category: 'Di chuyển',
                    member: 'Con Cả',
                    account: 'Ví tiền mặt',
                    notes: 'Vé xe bus tháng & xăng xe máy'
                },
                {
                    id: 't-16',
                    type: 'expense',
                    amount: 500000,
                    date: `${lastMY}-${lastM}-25`,
                    category: 'Mua sắm',
                    member: 'Con Cả',
                    account: 'Ví tiền mặt',
                    notes: 'Mua giày thể thao mới'
                }
            ],
            budgets: {
                "Ăn uống": 6000000,
                "Di chuyển": 2000000,
                "Hóa đơn": 8000000,
                "Giải trí": 3000000,
                "Giáo dục": 5000000,
                "Mua sắm": 4000000
            },
            goals: [
                {
                    id: 'g-1',
                    name: 'Quỹ dự phòng khẩn cấp',
                    targetAmount: 50000000,
                    currentAmount: 35000000,
                    targetDate: `${y}-12-31`
                },
                {
                    id: 'g-2',
                    name: 'Mua xe máy cho Con',
                    targetAmount: 30000000,
                    currentAmount: 12000000,
                    targetDate: `${y}-09-30`
                },
                {
                    id: 'g-3',
                    name: 'Du lịch Tết gia đình',
                    targetAmount: 20000000,
                    currentAmount: 5000000,
                    targetDate: `${y}-12-15`
                }
            ],
            members: DEFAULT_MEMBERS,
            accounts: DEFAULT_ACCOUNTS
        };
    }

    // State nội bộ của ứng dụng
    let state = {
        transactions: [],
        budgets: {},
        goals: [],
        members: [],
        accounts: [],
        categories: DEFAULT_CATEGORIES
    };

    // Tải dữ liệu từ LocalStorage hoặc khởi tạo dữ liệu mẫu
    function load() {
        try {
            const dataStr = localStorage.getItem(STORAGE_KEY);
            if (dataStr) {
                const parsed = JSON.parse(dataStr);
                state = {
                    transactions: parsed.transactions || [],
                    budgets: parsed.budgets || {},
                    goals: parsed.goals || [],
                    members: parsed.members || DEFAULT_MEMBERS,
                    accounts: parsed.accounts || DEFAULT_ACCOUNTS,
                    categories: parsed.categories || DEFAULT_CATEGORIES
                };
            } else {
                state = getMockData();
                save();
            }
        } catch (error) {
            console.error("Lỗi khi đọc dữ liệu từ localStorage:", error);
            state = getMockData();
        }
    }

    // Lưu dữ liệu vào LocalStorage
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error("Lỗi khi lưu dữ liệu vào localStorage:", error);
        }
    }

    // API quản trị Store
    window.Store = {
        init() {
            load();
        },

        getState() {
            return state;
        },

        // --- GIAO DỊCH (Transactions) ---
        getTransactions() {
            return state.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        },

        addTransaction(transaction) {
            const newTx = {
                id: 't-' + Date.now(),
                ...transaction,
                amount: parseFloat(transaction.amount)
            };
            state.transactions.push(newTx);
            save();
            return newTx;
        },

        updateTransaction(id, updatedData) {
            const index = state.transactions.findIndex(t => t.id === id);
            if (index !== -1) {
                state.transactions[index] = {
                    ...state.transactions[index],
                    ...updatedData,
                    amount: parseFloat(updatedData.amount)
                };
                save();
                return state.transactions[index];
            }
            return null;
        },

        deleteTransaction(id) {
            const index = state.transactions.findIndex(t => t.id === id);
            if (index !== -1) {
                state.transactions.splice(index, 1);
                save();
                return true;
            }
            return false;
        },

        // --- NGÂN SÁCH (Budgets) ---
        getBudgets() {
            return state.budgets;
        },

        setBudget(category, amount) {
            state.budgets[category] = parseFloat(amount);
            save();
            return state.budgets;
        },

        deleteBudget(category) {
            if (state.budgets[category] !== undefined) {
                delete state.budgets[category];
                save();
                return true;
            }
            return false;
        },

        // --- MỤC TIÊU TIẾT KIỆM (Goals) ---
        getGoals() {
            return state.goals;
        },

        addGoal(goal) {
            const newGoal = {
                id: 'g-' + Date.now(),
                name: goal.name,
                targetAmount: parseFloat(goal.targetAmount),
                currentAmount: parseFloat(goal.currentAmount || 0),
                targetDate: goal.targetDate
            };
            state.goals.push(newGoal);
            save();
            return newGoal;
        },

        updateGoal(id, updatedData) {
            const index = state.goals.findIndex(g => g.id === id);
            if (index !== -1) {
                state.goals[index] = {
                    ...state.goals[index],
                    ...updatedData,
                    targetAmount: parseFloat(updatedData.targetAmount),
                    currentAmount: parseFloat(updatedData.currentAmount)
                };
                save();
                return state.goals[index];
            }
            return null;
        },

        addSavingsContribution(id, amount) {
            const goal = state.goals.find(g => g.id === id);
            if (goal) {
                goal.currentAmount = (goal.currentAmount || 0) + parseFloat(amount);
                
                // Đồng thời tạo một giao dịch Chi tiết kiệm để phản ánh trong tài khoản chính
                this.addTransaction({
                    type: 'expense',
                    amount: parseFloat(amount),
                    date: new Date().toISOString().split('T')[0],
                    category: 'Tiết kiệm',
                    member: 'Gia đình',
                    account: 'Tài khoản ngân hàng',
                    notes: `Trích tích lũy cho mục tiêu: ${goal.name}`
                });
                
                save();
                return goal;
            }
            return null;
        },

        deleteGoal(id) {
            const index = state.goals.findIndex(g => g.id === id);
            if (index !== -1) {
                state.goals.splice(index, 1);
                save();
                return true;
            }
            return false;
        },

        // --- DANH MỤC, THÀNH VIÊN, TÀI KHOẢN ---
        getCategories() {
            return state.categories;
        },

        getMembers() {
            return state.members;
        },

        addMember(name) {
            if (name && !state.members.includes(name)) {
                state.members.push(name);
                save();
                return true;
            }
            return false;
        },

        getAccounts() {
            return state.accounts;
        },

        addAccount(name) {
            if (name && !state.accounts.includes(name)) {
                state.accounts.push(name);
                save();
                return true;
            }
            return false;
        },

        // --- CÁC HÀM TIỆN ÍCH TỔNG HỢP ---
        getCategoryIcon(category) {
            return CATEGORY_ICONS[category] || "fa-question-circle";
        },

        getCategoryColor(category) {
            return CATEGORY_COLORS[category] || "hsl(215, 16%, 47%)";
        },

        // Tính toán các chỉ số tài chính tổng hợp
        getFinancialSummary(filterMonth, filterYear) {
            let txs = state.transactions;
            
            // Lọc theo tháng năm nếu được truyền vào
            if (filterMonth && filterYear) {
                txs = txs.filter(t => {
                    const d = new Date(t.date);
                    return d.getFullYear() === parseInt(filterYear) && (d.getMonth() + 1) === parseInt(filterMonth);
                });
            }

            let totalIncome = 0;
            let totalExpense = 0;

            txs.forEach(t => {
                if (t.type === 'income') {
                    totalIncome += t.amount;
                } else if (t.type === 'expense') {
                    totalExpense += t.amount;
                }
            });

            // Số dư lũy kế toàn bộ thời gian (không lọc theo tháng)
            let netBalance = 0;
            state.transactions.forEach(t => {
                if (t.type === 'income') {
                    netBalance += t.amount;
                } else if (t.type === 'expense') {
                    netBalance -= t.amount;
                }
            });

            // Tổng tiết kiệm tích lũy
            let totalSaved = 0;
            state.goals.forEach(g => {
                totalSaved += g.currentAmount;
            });

            const savingRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

            return {
                netBalance,
                monthlyIncome: totalIncome,
                monthlyExpense: totalExpense,
                savingRate: Math.max(0, savingRate),
                totalSaved
            };
        }
    };
})();
