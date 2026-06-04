// App.js - Trực quan hóa và Quản lý Tương tác giao diện người dùng (Controller)

(function() {
    let currentTab = 'dashboard';
    let currentTxType = 'expense'; // mặc định là chi tiêu khi tạo giao dịch mới
    
    // Định dạng tiền tệ VND chuyên nghiệp (ví dụ: 15.000.000 đ)
    function formatVND(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    // Định dạng ngày hiển thị tiếng Việt (ví dụ: 03/06/2026)
    function formatDateVN(dateStr) {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Lấy ngày hôm nay định dạng YYYY-MM-DD cho ô input date
    function getTodayInputStr() {
        return new Date().toISOString().split('T')[0];
    }

    // Hiển thị ngày hôm nay ở Header bằng tiếng Việt phong cách lịch lãm
    function displayCurrentHeaderDate() {
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const today = new Date();
        const dayName = days[today.getDay()];
        const date = today.getDate();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        
        const dateStr = `Hôm nay là ${dayName}, ngày ${date} tháng ${month} năm ${year}`;
        const el = document.getElementById('current-date-display');
        if (el) el.textContent = dateStr;
    }

    // Hàm định dạng số dạng 1.000.000 từ một chuỗi thô
    function formatNumberWithDots(valStr) {
        const cleanStr = String(valStr).replace(/\D/g, '');
        if (!cleanStr) return '';
        return cleanStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    // Gán sự kiện format tự động cho các ô nhập số tiền
    function initAmountFormatting() {
        const amountInputIds = [
            'tx-amount',
            'budget-amount',
            'goal-target-amount',
            'goal-current-amount',
            'contribution-amount'
        ];
        
        amountInputIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            
            el.addEventListener('input', function() {
                const start = this.selectionStart;
                const end = this.selectionEnd;
                const origLength = this.value.length;
                
                const formatted = formatNumberWithDots(this.value);
                this.value = formatted;
                
                const newLength = formatted.length;
                const diff = newLength - origLength;
                this.setSelectionRange(start + diff, end + diff);
            });
        });
    }

    // --- KHỞI TẠO BỘ CHỌN/DỮ LIỆU ĐỘNG CHO FORMS ---
    function populateFormSelects() {
        const state = window.Store.getState();
        
        // 1. Điền danh sách Thành viên gia đình vào Form giao dịch & lọc giao dịch
        const memberSelects = [
            document.getElementById('tx-member'),
            document.getElementById('tx-filter-member')
        ];
        
        memberSelects.forEach(select => {
            if (!select) return;
            // Lưu lại option đầu tiên (như "Thành viên")
            const firstOption = select.options[0] ? select.options[0].outerHTML : '';
            select.innerHTML = firstOption + state.members.map(m => `<option value="${m}">${m}</option>`).join('');
        });

        // 2. Điền danh sách Tài khoản/Ví vào Form giao dịch & lọc giao dịch
        const accountSelects = [
            document.getElementById('tx-account'),
            document.getElementById('tx-filter-account')
        ];
        
        accountSelects.forEach(select => {
            if (!select) return;
            const firstOption = select.options[0] ? select.options[0].outerHTML : '';
            select.innerHTML = firstOption + state.accounts.map(a => `<option value="${a}">${a}</option>`).join('');
        });

        // 3. Điền danh mục chi tiêu vào bộ chọn thiết lập Ngân sách
        const budgetCatSelect = document.getElementById('budget-category-select');
        if (budgetCatSelect) {
            budgetCatSelect.innerHTML = state.categories.expense.map(c => `<option value="${c}">${c}</option>`).join('');
        }

        // Cập nhật danh mục trong Form giao dịch dựa trên loại (Thu/Chi)
        updateTxFormCategories();
        
        // Điền bộ lọc danh mục trong trang Giao dịch
        updateFilterCategoryDropdown();
    }

    // Cập nhật dropdown Danh mục trong form giao dịch dựa trên loại Thu nhập / Chi tiêu
    function updateTxFormCategories() {
        const categories = window.Store.getCategories();
        const txCategorySelect = document.getElementById('tx-category');
        if (!txCategorySelect) return;

        const currentCats = currentTxType === 'income' ? categories.income : categories.expense;
        txCategorySelect.innerHTML = currentCats.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // Cập nhật dropdown lọc Danh mục ở trang Giao dịch
    function updateFilterCategoryDropdown() {
        const categories = window.Store.getCategories();
        const filterCatSelect = document.getElementById('tx-filter-category');
        if (!filterCatSelect) return;

        // Gộp tất cả danh mục của cả thu và chi
        const allCats = [...new Set([...categories.income, ...categories.expense])];
        
        const firstOption = filterCatSelect.options[0] ? filterCatSelect.options[0].outerHTML : '';
        filterCatSelect.innerHTML = firstOption + allCats.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // Lọc giao dịch theo Tháng / Năm được chọn ở Header
    function getFilteredTransactions() {
        const month = document.getElementById('header-filter-month').value;
        const year = document.getElementById('header-filter-year').value;
        const txs = window.Store.getTransactions();

        return txs.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month);
        });
    }

    // Cập nhật các thẻ số liệu tổng hợp ở Header/Dashboard
    function updateSummaryStats() {
        const month = document.getElementById('header-filter-month').value;
        const year = document.getElementById('header-filter-year').value;
        
        const summary = window.Store.getFinancialSummary(month, year);

        // Cập nhật giao diện
        document.getElementById('val-net-balance').textContent = formatVND(summary.netBalance);
        document.getElementById('val-monthly-income').textContent = formatVND(summary.monthlyIncome);
        document.getElementById('val-monthly-expense').textContent = formatVND(summary.monthlyExpense);
        document.getElementById('val-total-saved').textContent = formatVND(summary.totalSaved);

        // Style màu sắc số dư âm/dương
        const balanceEl = document.getElementById('val-net-balance');
        if (summary.netBalance >= 0) {
            balanceEl.style.color = 'var(--text-primary)';
        } else {
            balanceEl.style.color = 'var(--expense)';
        }
    }

    // --- RENDERING TABS ---

    // 1. Render Dashboard Tab
    function renderDashboard() {
        updateSummaryStats();
        
        const month = document.getElementById('header-filter-month').value;
        const year = document.getElementById('header-filter-year').value;
        const allTxs = window.Store.getTransactions();
        const monthlyTxs = getFilteredTransactions();

        // Vẽ biểu đồ xu hướng (Sử dụng toàn bộ giao dịch để vẽ biểu đồ bar các tháng)
        window.ChartManager.renderTrendChart('chart-dashboard-trend', allTxs);
        
        // Vẽ biểu đồ thành viên chi tiêu (Sử dụng giao dịch tháng lọc)
        window.ChartManager.renderMemberChart('chart-dashboard-member', monthlyTxs);

        // Hiển thị 5 giao dịch gần đây nhất của tháng được lọc (hoặc toàn bộ nếu tháng đó rỗng)
        const recentTxsContainer = document.getElementById('dashboard-recent-transactions');
        if (recentTxsContainer) {
            const displayTxs = monthlyTxs.slice(0, 5);
            
            if (displayTxs.length === 0) {
                recentTxsContainer.innerHTML = `
                    <div class="empty-state" style="padding: 1.5rem;">
                        <i class="fa-solid fa-folder-open empty-state-icon" style="font-size: 2rem;"></i>
                        <p class="empty-state-text" style="font-size: 0.85rem;">Không có giao dịch nào trong tháng ${month}/${year}</p>
                    </div>`;
            } else {
                recentTxsContainer.innerHTML = displayTxs.map(t => createTransactionItemHTML(t)).join('');
            }
        }

        // Hiển thị ngân sách cần lưu ý (brief)
        renderBudgetsBrief(monthlyTxs);
    }

    // Hàm tạo HTML cho 1 dòng giao dịch
    function createTransactionItemHTML(t) {
        const icon = window.Store.getCategoryIcon(t.category);
        const color = window.Store.getCategoryColor(t.category);
        const sign = t.type === 'income' ? '+' : '-';
        const amountClass = t.type === 'income' ? 'income' : 'expense';
        
        return `
            <div class="transaction-item">
                <div class="tx-left">
                    <div class="tx-category-icon" style="background: rgba(${color.replace('hsl', '').replace(')', '')}, 0.1); color: ${color};">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="tx-info">
                        <span class="tx-title">${t.notes || t.category}</span>
                        <div class="tx-meta">
                            <span><i class="fa-solid fa-user"></i> ${t.member}</span>
                            <span><i class="fa-solid fa-credit-card"></i> ${t.account}</span>
                            <span><i class="fa-solid fa-calendar"></i> ${formatDateVN(t.date)}</span>
                        </div>
                    </div>
                </div>
                <div class="tx-right">
                    <span class="tx-amount ${amountClass}">${sign}${formatVND(t.amount)}</span>
                    <div class="tx-actions">
                        <button class="btn-icon edit" onclick="app.openEditTransaction('${t.id}')" title="Sửa">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-icon delete" onclick="app.deleteTransaction('${t.id}')" title="Xóa">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>`;
    }

    // Hiển thị tóm tắt ngân sách trên Dashboard
    function renderBudgetsBrief(monthlyTxs) {
        const budgets = window.Store.getBudgets();
        const briefContainer = document.getElementById('dashboard-budgets-brief');
        if (!briefContainer) return;

        const categories = Object.keys(budgets);
        if (categories.length === 0) {
            briefContainer.innerHTML = `
                <div class="empty-state" style="padding: 1.5rem;">
                    <i class="fa-solid fa-sliders empty-state-icon" style="font-size: 2rem;"></i>
                    <p class="empty-state-text" style="font-size: 0.85rem;">Chưa thiết lập ngân sách chi tiêu nào.</p>
                </div>`;
            return;
        }

        // Tính chi tiêu thực tế của từng danh mục ngân sách
        const budgetBriefs = categories.map(cat => {
            const limit = budgets[cat];
            const spent = monthlyTxs
                .filter(t => t.type === 'expense' && t.category === cat)
                .reduce((sum, t) => sum + t.amount, 0);
            
            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            return { cat, limit, spent, percent };
        });

        // Sắp xếp theo tỉ lệ phần trăm sử dụng giảm dần (ưu tiên các mục sắp quá giới hạn)
        budgetBriefs.sort((a, b) => b.percent - a.percent);

        // Chỉ hiển thị tối đa 3 mục ngân sách đáng chú ý
        const displayBudgets = budgetBriefs.slice(0, 3);

        briefContainer.innerHTML = displayBudgets.map(b => {
            let statusClass = 'safe';
            let barColor = 'var(--income)';
            if (b.percent >= 100) {
                statusClass = 'danger';
                barColor = 'var(--expense)';
            } else if (b.percent >= 80) {
                statusClass = 'warning';
                barColor = 'var(--warning)';
            }

            return `
                <div style="display: flex; flex-direction: column; gap: 0.4rem; padding: 0.75rem 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.03);">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="font-weight: 600;">${b.cat}</span>
                        <span class="${statusClass}" style="font-weight: 700;">${b.percent.toFixed(0)}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${Math.min(100, b.percent)}%; background-color: ${barColor};"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary);">
                        <span>Đã chi: ${formatVND(b.spent)}</span>
                        <span>Hạn mức: ${formatVND(b.limit)}</span>
                    </div>
                </div>`;
        }).join('');
    }

    // 2. Render Transactions Tab
    function renderTransactions() {
        const txs = getFilteredTransactions();
        
        // Lấy các giá trị bộ lọc
        const searchQuery = document.getElementById('tx-search').value.toLowerCase().trim();
        const typeFilter = document.getElementById('tx-filter-type').value;
        const catFilter = document.getElementById('tx-filter-category').value;
        const memberFilter = document.getElementById('tx-filter-member').value;
        const accountFilter = document.getElementById('tx-filter-account').value;

        // Thực hiện lọc nâng cao
        let filtered = txs.filter(t => {
            // Lọc theo search ghi chú
            const matchSearch = !searchQuery || (t.notes && t.notes.toLowerCase().includes(searchQuery));
            // Lọc theo loại (thu/chi)
            const matchType = typeFilter === 'all' || t.type === typeFilter;
            // Lọc theo danh mục
            const matchCat = catFilter === 'all' || t.category === catFilter;
            // Lọc theo thành viên
            const matchMember = memberFilter === 'all' || t.member === memberFilter;
            // Lọc theo tài khoản/ví
            const matchAccount = accountFilter === 'all' || t.account === accountFilter;

            return matchSearch && matchType && matchCat && matchMember && matchAccount;
        });

        const listContainer = document.getElementById('transactions-main-list');
        if (!listContainer) return;

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-receipt empty-state-icon"></i>
                    <p class="empty-state-text">Không tìm thấy giao dịch nào phù hợp với bộ lọc của bạn.</p>
                </div>`;
        } else {
            listContainer.innerHTML = filtered.map(t => createTransactionItemHTML(t)).join('');
        }
    }

    // 3. Render Budgets Tab
    function renderBudgets() {
        const budgets = window.Store.getBudgets();
        const txs = getFilteredTransactions();
        const month = document.getElementById('header-filter-month').value;
        const year = document.getElementById('header-filter-year').value;
        
        const grid = document.getElementById('budgets-main-grid');
        if (!grid) return;

        const categories = Object.keys(budgets);

        if (categories.length === 0) {
            grid.innerHTML = `
                <div class="panel-card" style="grid-column: 1 / -1; padding: 3rem;">
                    <div class="empty-state">
                        <i class="fa-solid fa-sliders empty-state-icon"></i>
                        <h4 style="margin-top: 1rem; color: var(--text-primary);">Chưa có ngân sách hàng tháng</h4>
                        <p class="empty-state-text">Hãy thiết lập ngân sách chi tiêu hàng tháng cho từng danh mục để theo dõi tiến độ.</p>
                        <button class="btn-primary" style="margin-top: 1rem; width: auto;" onclick="app.openModal('modal-budget')">
                            <i class="fa-solid fa-plus"></i> Thiết lập ngay
                        </button>
                    </div>
                </div>`;
            return;
        }

        grid.innerHTML = categories.map(cat => {
            const limit = budgets[cat];
            // Tính số tiền đã chi cho danh mục này trong tháng hiện tại
            const spent = txs
                .filter(t => t.type === 'expense' && t.category === cat)
                .reduce((sum, t) => sum + t.amount, 0);

            const percent = limit > 0 ? (spent / limit) * 100 : 0;
            const remaining = limit - spent;

            let statusClass = 'safe';
            let barColor = 'var(--income)';
            let statusText = `Còn lại ${formatVND(remaining)}`;

            if (percent >= 100) {
                statusClass = 'danger';
                barColor = 'var(--expense)';
                statusText = `Vượt hạn mức ${formatVND(Math.abs(remaining))}`;
            } else if (percent >= 80) {
                statusClass = 'warning';
                barColor = 'var(--warning)';
                statusText = `Sắp chạm hạn mức (Còn ${formatVND(remaining)})`;
            }

            const icon = window.Store.getCategoryIcon(cat);
            const color = window.Store.getCategoryColor(cat);

            return `
                <div class="budget-card">
                    <div class="budget-card-header">
                        <div class="budget-category">
                            <div class="tx-category-icon" style="background: rgba(${color.replace('hsl', '').replace(')', '')}, 0.1); color: ${color}; width: 36px; height: 36px; font-size: 1rem;">
                                <i class="fa-solid ${icon}"></i>
                            </div>
                            <span class="budget-cat-name">${cat}</span>
                        </div>
                        <button class="btn-icon delete" onclick="app.deleteBudget('${cat}')" title="Xóa hạn mức" style="position: absolute; right: 1rem; top: 1rem;">
                            <i class="fa-solid fa-circle-xmark"></i>
                        </button>
                    </div>

                    <div class="budget-amounts">
                        <span class="budget-spent">${formatVND(spent)}</span>
                        <span class="budget-limit">/ ${formatVND(limit)}</span>
                    </div>

                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${Math.min(100, percent)}%; background-color: ${barColor};"></div>
                    </div>

                    <div class="budget-status-text ${statusClass}">
                        <span>${statusText}</span>
                        <span>${percent.toFixed(0)}%</span>
                    </div>
                </div>`;
        }).join('');
    }

    // 4. Render Savings Tab
    function renderSavings() {
        const goals = window.Store.getGoals();
        const grid = document.getElementById('goals-main-grid');
        if (!grid) return;

        if (goals.length === 0) {
            grid.innerHTML = `
                <div class="panel-card" style="grid-column: 1 / -1; padding: 3rem;">
                    <div class="empty-state">
                        <i class="fa-solid fa-piggy-bank empty-state-icon"></i>
                        <h4 style="margin-top: 1rem; color: var(--text-primary);">Chưa có mục tiêu tiết kiệm</h4>
                        <p class="empty-state-text">Hãy tạo các mục tiêu tiết kiệm để thúc đẩy thói quen tích lũy của gia đình.</p>
                        <button class="btn-primary" style="margin-top: 1rem; width: auto;" onclick="app.openModal('modal-goal')">
                            <i class="fa-solid fa-plus"></i> Tạo mục tiêu
                        </button>
                    </div>
                </div>`;
            return;
        }

        grid.innerHTML = goals.map(g => {
            const percent = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
            const remaining = g.targetAmount - g.currentAmount;
            
            return `
                <div class="goal-card">
                    <div class="goal-header">
                        <div class="goal-title-wrapper">
                            <span class="goal-name">${g.name}</span>
                            <span class="goal-date"><i class="fa-solid fa-calendar"></i> Hạn định: ${formatDateVN(g.targetDate)}</span>
                        </div>
                        <div style="display: flex; gap: 0.25rem;">
                            <button class="btn-icon edit" onclick="app.openEditGoal('${g.id}')" title="Sửa mục tiêu">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn-icon delete" onclick="app.deleteGoal('${g.id}')" title="Xóa mục tiêu">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <div class="goal-progress-info">
                        <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.2rem;">Đã tích lũy</div>
                            <span class="goal-current">${formatVND(g.currentAmount)}</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.2rem;">Mục tiêu</div>
                            <span class="goal-target" style="font-weight: 600; color: var(--text-primary); font-size: 1rem;">${formatVND(g.targetAmount)}</span>
                        </div>
                    </div>

                    <div class="progress-bar-container" style="height: 10px;">
                        <div class="progress-bar-fill" style="width: ${Math.min(100, percent)}%; background: linear-gradient(90deg, #f59e0b, #eab308);"></div>
                    </div>

                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem;">
                        <span style="color: var(--text-secondary);">
                            ${remaining > 0 ? `Còn thiếu: ${formatVND(remaining)}` : '<span style="color: var(--income); font-weight:600;"><i class="fa-solid fa-circle-check"></i> Đã hoàn thành!</span>'}
                        </span>
                        <span style="font-weight: 700; color: var(--warning);">${percent.toFixed(0)}%</span>
                    </div>

                    <div class="goal-card-footer">
                        <button class="btn-secondary" onclick="app.openContribution('${g.id}', '${g.name.replace(/'/g, "\\'")}')" ${remaining <= 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                            <i class="fa-solid fa-plus-circle"></i> Trích tiền tích lũy
                        </button>
                    </div>
                </div>`;
        }).join('');
    }

    // 5. Render Reports Tab
    function renderReports() {
        const txs = getFilteredTransactions();
        const month = document.getElementById('header-filter-month').value;
        const year = document.getElementById('header-filter-year').value;

        // Vẽ biểu đồ phân tích chi tiết các danh mục chi tiêu trong tháng được lọc
        window.ChartManager.renderCategoryChart('chart-reports-category', txs);

        // Tính toán phân tích thông minh
        let categoryExpenses = {};
        let memberExpenses = {};
        let totalIncome = 0;
        let totalExpense = 0;

        txs.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else if (t.type === 'expense') {
                totalExpense += t.amount;
                
                // Gom danh mục
                categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
                // Gom thành viên
                memberExpenses[t.member] = (memberExpenses[t.member] || 0) + t.amount;
            }
        });

        // 1. Danh mục chi nhiều nhất
        let highestCategory = 'Không có chi tiêu';
        let maxCatAmount = 0;
        Object.keys(categoryExpenses).forEach(cat => {
            if (categoryExpenses[cat] > maxCatAmount) {
                maxCatAmount = categoryExpenses[cat];
                highestCategory = cat;
            }
        });
        const highestCatEl = document.getElementById('report-highest-category');
        if (highestCatEl) {
            highestCatEl.textContent = maxCatAmount > 0 ? `${highestCategory} (${formatVND(maxCatAmount)})` : 'Không';
        }

        // 2. Thành viên chi nhiều nhất
        let highestMember = 'Không';
        let maxMemberAmount = 0;
        Object.keys(memberExpenses).forEach(m => {
            if (memberExpenses[m] > maxMemberAmount) {
                maxMemberAmount = memberExpenses[m];
                highestMember = m;
            }
        });
        const highestMemEl = document.getElementById('report-highest-member');
        if (highestMemEl) {
            highestMemEl.textContent = maxMemberAmount > 0 ? `${highestMember} (${formatVND(maxMemberAmount)})` : 'Không';
        }

        // 3. Tỷ lệ tiết kiệm và Tích lũy thực tế
        const summary = window.Store.getFinancialSummary(month, year);
        const savingRateEl = document.getElementById('report-saving-rate');
        if (savingRateEl) {
            savingRateEl.textContent = `${summary.savingRate.toFixed(1)}%`;
        }

        const netSavingsEl = document.getElementById('report-net-savings');
        if (netSavingsEl) {
            const net = summary.monthlyIncome - summary.monthlyExpense;
            netSavingsEl.textContent = formatVND(Math.max(0, net));
            netSavingsEl.style.color = net >= 0 ? 'var(--income)' : 'var(--expense)';
        }
    }

    // --- XỬ LÝ CHUYỂN TAB ---
    function switchTab(tabId) {
        currentTab = tabId;
        
        // Cập nhật class active trên menu sidebar
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Ẩn tất cả các Section view và hiển thị section được chọn
        document.querySelectorAll('.tab-view').forEach(view => {
            view.classList.remove('active-view');
            view.style.display = 'none';
        });

        const targetView = document.getElementById(`${tabId}-view`);
        if (targetView) {
            targetView.classList.add('active-view');
            targetView.style.display = 'block';
        }

        // Kích hoạt render lại dữ liệu phù hợp
        if (tabId === 'dashboard') renderDashboard();
        else if (tabId === 'transactions') renderTransactions();
        else if (tabId === 'budgets') renderBudgets();
        else if (tabId === 'savings') renderSavings();
        else if (tabId === 'reports') renderReports();
    }

    // --- MODAL CONTROLLER ---
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            // Reset form bên trong modal nếu có
            const form = modal.querySelector('form');
            if (form) form.reset();
        }
    }

    // Thiết lập loại giao dịch (Thu/Chi) trong Form
    function setTxType(type) {
        currentTxType = type;
        const btnExpense = document.getElementById('tx-type-expense');
        const btnIncome = document.getElementById('tx-type-income');

        if (type === 'income') {
            btnIncome.classList.add('active');
            btnExpense.classList.remove('active');
        } else {
            btnExpense.classList.add('active');
            btnIncome.classList.remove('active');
        }
        
        updateTxFormCategories();
    }

    // --- CRUD ACTIONS ---

    // 1. Thêm/Sửa giao dịch
    function handleTransactionSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('tx-id-input').value;
        const amountStr = document.getElementById('tx-amount').value.replace(/\./g, '');
        const date = document.getElementById('tx-date').value;
        const category = document.getElementById('tx-category').value;
        const member = document.getElementById('tx-member').value;
        const account = document.getElementById('tx-account').value;
        const notes = document.getElementById('tx-notes').value;

        const txData = {
            type: currentTxType,
            amount: parseFloat(amountStr) || 0,
            date,
            category,
            member,
            account,
            notes
        };

        if (id) {
            window.Store.updateTransaction(id, txData);
        } else {
            window.Store.addTransaction(txData);
        }

        closeModal('modal-transaction');
        refreshActiveTab();
    }

    function openEditTransaction(id) {
        const txs = window.Store.getTransactions();
        const tx = txs.find(t => t.id === id);
        if (!tx) return;

        // Điền dữ liệu vào form
        document.getElementById('tx-id-input').value = tx.id;
        document.getElementById('tx-amount').value = formatNumberWithDots(tx.amount);
        document.getElementById('tx-date').value = tx.date;
        document.getElementById('tx-notes').value = tx.notes || '';

        setTxType(tx.type); // cập nhật danh mục dropdown tương ứng
        document.getElementById('tx-category').value = tx.category;
        document.getElementById('tx-member').value = tx.member;
        document.getElementById('tx-account').value = tx.account;

        document.getElementById('transaction-modal-title').textContent = 'Chỉnh Sửa Giao Dịch';
        openModal('modal-transaction');
    }

    function deleteTransaction(id) {
        if (confirm('Bạn có chắc chắn muốn xóa giao dịch này không?')) {
            window.Store.deleteTransaction(id);
            refreshActiveTab();
        }
    }

    // 2. Thiết lập Hạn mức Ngân sách
    function handleBudgetSubmit(e) {
        e.preventDefault();
        const category = document.getElementById('budget-category-select').value;
        const amountStr = document.getElementById('budget-amount').value.replace(/\./g, '');

        window.Store.setBudget(category, parseFloat(amountStr) || 0);
        closeModal('modal-budget');
        refreshActiveTab();
    }

    function deleteBudget(category) {
        if (confirm(`Bạn có chắc chắn muốn xóa hạn mức chi tiêu của danh mục "${category}"?`)) {
            window.Store.deleteBudget(category);
            refreshActiveTab();
        }
    }

    // 3. Thêm/Sửa mục tiêu tiết kiệm
    function handleGoalSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('goal-id-input').value;
        const name = document.getElementById('goal-name').value;
        const targetAmountStr = document.getElementById('goal-target-amount').value.replace(/\./g, '');
        const currentAmountStr = document.getElementById('goal-current-amount').value.replace(/\./g, '');
        const targetDate = document.getElementById('goal-target-date').value;

        const goalData = {
            name,
            targetAmount: parseFloat(targetAmountStr) || 0,
            currentAmount: parseFloat(currentAmountStr) || 0,
            targetDate
        };

        if (id) {
            window.Store.updateGoal(id, goalData);
        } else {
            window.Store.addGoal(goalData);
        }

        closeModal('modal-goal');
        refreshActiveTab();
    }

    function openEditGoal(id) {
        const goals = window.Store.getGoals();
        const goal = goals.find(g => g.id === id);
        if (!goal) return;

        document.getElementById('goal-id-input').value = goal.id;
        document.getElementById('goal-name').value = goal.name;
        document.getElementById('goal-target-amount').value = formatNumberWithDots(goal.targetAmount);
        document.getElementById('goal-current-amount').value = formatNumberWithDots(goal.currentAmount);
        document.getElementById('goal-target-date').value = goal.targetDate;

        document.getElementById('goal-modal-title').textContent = 'Chỉnh Sửa Mục Tiêu';
        openModal('modal-goal');
    }

    function deleteGoal(id) {
        if (confirm('Bạn có chắc chắn muốn xóa mục tiêu tiết kiệm này?')) {
            window.Store.deleteGoal(id);
            refreshActiveTab();
        }
    }

    // 4. Trích nạp quỹ tiết kiệm (Savings Contribution)
    function openContribution(id, name) {
        document.getElementById('contribution-goal-id').value = id;
        document.getElementById('contribution-goal-name').value = name;
        document.getElementById('contribution-amount').value = '';
        openModal('modal-contribution');
    }

    function handleContributionSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('contribution-goal-id').value;
        const amountStr = document.getElementById('contribution-amount').value.replace(/\./g, '');

        window.Store.addSavingsContribution(id, parseFloat(amountStr) || 0);
        closeModal('modal-contribution');
        refreshActiveTab();
    }

    // --- XUẤT DỮ LIỆU ---
    
    // Xuất Excel CSV
    function exportToCSV() {
        const txs = window.Store.getTransactions();
        if (txs.length === 0) {
            alert('Không có dữ liệu giao dịch để xuất.');
            return;
        }

        // Tiêu đề cột
        let csvContent = '\uFEFF'; // BOM để hiển thị đúng tiếng Việt có dấu trong Excel
        csvContent += 'Loại,Số tiền,Ngày,Danh mục,Thành viên,Tài khoản,Ghi chú\n';

        txs.forEach(t => {
            const typeText = t.type === 'income' ? 'Thu nhập' : 'Chi tiêu';
            const notes = (t.notes || '').replace(/"/g, '""'); // Escape dấu nháy
            csvContent += `"${typeText}",${t.amount},"${t.date}","${t.category}","${t.member}","${t.account}","${notes}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bao_cao_tai_chinh_gia_dinh_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Sao lưu file JSON
    function exportToJSON() {
        const state = window.Store.getState();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 4));
        const link = document.createElement('a');
        link.setAttribute('href', dataStr);
        link.setAttribute('download', `saoluu_taichinh_giadinh_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Refresh dữ liệu tab đang mở hiện tại
    function refreshActiveTab() {
        switchTab(currentTab);
    }

    // --- KHỞI CHẠY HỆ THỐNG ---
    async function init() {
        // Khởi động kho dữ liệu (LocalStorage + Firestore)
        await window.Store.init();

        // Hiển thị ngày tháng trên Header
        displayCurrentHeaderDate();

        // Nạp các dữ liệu cấu hình vào bộ chọn HTML
        populateFormSelects();

        // Kích hoạt định dạng tiền tệ khi gõ cho các ô nhập liệu
        initAmountFormatting();

        // Gán sự kiện Click các tab sidebar
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function() {
                const tab = this.getAttribute('data-tab');
                switchTab(tab);
            });
        });

        // Sự kiện thay đổi bộ lọc Tháng / Năm ở Header
        document.getElementById('header-filter-month').addEventListener('change', refreshActiveTab);
        document.getElementById('header-filter-year').addEventListener('change', refreshActiveTab);

        // Nút thêm nhanh giao dịch mở modal
        document.getElementById('btn-add-tx-quick').addEventListener('click', () => {
            // Reset input sửa đổi
            document.getElementById('tx-id-input').value = '';
            document.getElementById('form-transaction').reset();
            document.getElementById('tx-date').value = getTodayInputStr();
            setTxType('expense'); // mặc định là chi
            document.getElementById('transaction-modal-title').textContent = 'Thêm Giao Dịch Mới';
            openModal('modal-transaction');
        });

        // Form Giao dịch Submit
        document.getElementById('form-transaction').addEventListener('submit', handleTransactionSubmit);

        // Nút thêm hạn mức ngân sách mở modal
        const btnAddBudget = document.getElementById('btn-add-budget');
        if (btnAddBudget) {
            btnAddBudget.addEventListener('click', () => {
                openModal('modal-budget');
            });
        }
        document.getElementById('form-budget').addEventListener('submit', handleBudgetSubmit);

        // Nút thêm mục tiêu tiết kiệm mở modal
        const btnAddGoal = document.getElementById('btn-add-goal');
        if (btnAddGoal) {
            btnAddGoal.addEventListener('click', () => {
                document.getElementById('goal-id-input').value = '';
                document.getElementById('form-goal').reset();
                document.getElementById('goal-target-date').value = getTodayInputStr();
                document.getElementById('goal-modal-title').textContent = 'Tạo Mục Tiêu Tiết Kiệm';
                openModal('modal-goal');
            });
        }
        document.getElementById('form-goal').addEventListener('submit', handleGoalSubmit);

        // Form trích nạp quỹ tiết kiệm submit
        document.getElementById('form-contribution').addEventListener('submit', handleContributionSubmit);

        // Sự kiện lọc giao dịch (tìm kiếm và select thay đổi)
        document.getElementById('tx-search').addEventListener('input', renderTransactions);
        document.getElementById('tx-filter-type').addEventListener('change', renderTransactions);
        document.getElementById('tx-filter-category').addEventListener('change', renderTransactions);
        document.getElementById('tx-filter-member').addEventListener('change', renderTransactions);
        document.getElementById('tx-filter-account').addEventListener('change', renderTransactions);

        // Gán nút Xuất dữ liệu
        document.getElementById('btn-export-csv').addEventListener('click', exportToCSV);
        document.getElementById('btn-export-json').addEventListener('click', exportToJSON);

        // Render tab mặc định lần đầu
        switchTab('dashboard');
    }

    // Xuất API điều khiển ra phạm vi toàn cục
    window.app = {
        switchTab,
        openModal,
        closeModal,
        setTxType,
        openEditTransaction,
        deleteTransaction,
        deleteBudget,
        openEditGoal,
        deleteGoal,
        openContribution,
        // Dùng bởi store.js sau khi tải dữ liệu Firestore xong
        refreshAllViews() {
            populateFormSelects();
            refreshActiveTab();
        }
    };

    // Đợi DOM sẵn sàng rồi chạy ứng dụng
    document.addEventListener('DOMContentLoaded', init);
})();
