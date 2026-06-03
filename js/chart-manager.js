// ChartManager.js - Quản lý và vẽ các biểu đồ báo cáo sử dụng Chart.js

(function() {
    let instances = {};

    // Hủy bỏ biểu đồ cũ nếu đã tồn tại để tránh lỗi vẽ đè trong Chart.js
    function destroyChart(key) {
        if (instances[key]) {
            instances[key].destroy();
            delete instances[key];
        }
    }

    // Tiện ích định dạng tiền tệ tiếng Việt viết tắt (ví dụ: 1.5M, 500K)
    function formatShortVND(value) {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'K';
        }
        return value;
    }

    window.ChartManager = {
        // 1. Biểu đồ đường xu hướng Thu - Chi trên Dashboard
        renderTrendChart(canvasId, transactions) {
            destroyChart(canvasId);

            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            // Xử lý dữ liệu: Gom nhóm theo tháng
            const monthlyData = {};
            
            // Lấy 6 tháng gần nhất hoặc tối thiểu là tháng hiện tại và tháng trước
            // Sắp xếp giao dịch từ cũ đến mới để vẽ đường xu hướng
            const sortedTxs = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

            sortedTxs.forEach(tx => {
                const dateObj = new Date(tx.date);
                const monthYear = `${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
                
                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = { income: 0, expense: 0 };
                }

                if (tx.type === 'income') {
                    monthlyData[monthYear].income += tx.amount;
                } else if (tx.type === 'expense') {
                    monthlyData[monthYear].expense += tx.amount;
                }
            });

            // Nếu không có dữ liệu, thêm tháng hiện tại làm rỗng
            const labels = Object.keys(monthlyData);
            if (labels.length === 0) {
                const now = new Date();
                labels.push(`${now.getMonth() + 1}/${now.getFullYear()}`);
                monthlyData[labels[0]] = { income: 0, expense: 0 };
            }

            const incomeDataset = [];
            const expenseDataset = [];

            labels.forEach(label => {
                incomeDataset.push(monthlyData[label].income);
                expenseDataset.push(monthlyData[label].expense);
            });

            const ctx = canvas.getContext('2d');
            instances[canvasId] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Thu nhập',
                            data: incomeDataset,
                            backgroundColor: 'rgba(16, 185, 129, 0.85)',
                            borderColor: '#10b981',
                            borderWidth: 1,
                            borderRadius: 6,
                            barPercentage: 0.6,
                            categoryPercentage: 0.6
                        },
                        {
                            label: 'Chi tiêu',
                            data: expenseDataset,
                            backgroundColor: 'rgba(244, 63, 94, 0.85)',
                            borderColor: '#f43f5e',
                            borderWidth: 1,
                            borderRadius: 6,
                            barPercentage: 0.6,
                            categoryPercentage: 0.6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#94a3b8',
                                font: { family: 'Inter', size: 12, weight: '500' }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#0f172a',
                            titleColor: '#f8fafc',
                            bodyColor: '#f8fafc',
                            borderColor: 'rgba(255, 255, 255, 0.08)',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) label += ': ';
                                    if (context.raw !== null) {
                                        label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.raw);
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { family: 'Inter' } }
                        },
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.03)' },
                            ticks: {
                                color: '#94a3b8',
                                font: { family: 'Inter' },
                                callback: function(value) {
                                    return formatShortVND(value);
                                }
                            }
                        }
                    }
                }
            });
        },

        // 2. Biểu đồ tròn phân bổ chi tiêu theo Thành viên Gia đình
        renderMemberChart(canvasId, transactions) {
            destroyChart(canvasId);

            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            // Xử lý dữ liệu: Chi tiêu của các thành viên
            const memberData = {};
            let hasExpense = false;

            transactions.forEach(tx => {
                if (tx.type === 'expense') {
                    const member = tx.member || 'Khác';
                    memberData[member] = (memberData[member] || 0) + tx.amount;
                    hasExpense = true;
                }
            });

            const labels = Object.keys(memberData);
            const dataValues = labels.map(label => memberData[label]);

            // Mảng màu sắc HSL sang trọng cho từng thành viên
            const colors = [
                'hsl(262, 83%, 65%)', // Bố
                'hsl(328, 90%, 60%)', // Mẹ
                'hsl(187, 92%, 45%)', // Con Cả
                'hsl(43, 96%, 55%)',  // Con Út
                'hsl(142, 70%, 50%)',
                'hsl(200, 95%, 50%)'
            ];

            const ctx = canvas.getContext('2d');
            
            if (!hasExpense) {
                // Nếu chưa có dữ liệu chi tiêu
                instances[canvasId] = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Chưa có chi tiêu'],
                        datasets: [{
                            data: [1],
                            backgroundColor: ['rgba(255, 255, 255, 0.05)'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false }
                        }
                    }
                });
                return;
            }

            instances[canvasId] = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataValues,
                        backgroundColor: colors.slice(0, labels.length),
                        borderColor: '#0f172a',
                        borderWidth: 2,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#94a3b8',
                                font: { family: 'Inter', size: 11 },
                                boxWidth: 12
                            }
                        },
                        tooltip: {
                            backgroundColor: '#0f172a',
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const formatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
                                    return ` ${context.label}: ${formatted}`;
                                }
                            }
                        }
                    }
                }
            });
        },

        // 3. Biểu đồ donut phân tách chi tiêu theo Danh mục trên Trang báo cáo
        renderCategoryChart(canvasId, transactions) {
            destroyChart(canvasId);

            const canvas = document.getElementById(canvasId);
            if (!canvas) return;

            const categoryData = {};
            let hasExpense = false;

            transactions.forEach(tx => {
                if (tx.type === 'expense') {
                    const cat = tx.category || 'Khác';
                    categoryData[cat] = (categoryData[cat] || 0) + tx.amount;
                    hasExpense = true;
                }
            });

            const labels = Object.keys(categoryData);
            const dataValues = labels.map(label => categoryData[label]);
            const bgColors = labels.map(label => window.Store.getCategoryColor(label));

            const ctx = canvas.getContext('2d');

            if (!hasExpense) {
                instances[canvasId] = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Chưa có dữ liệu'],
                        datasets: [{
                            data: [1],
                            backgroundColor: ['rgba(255, 255, 255, 0.05)'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false }
                        }
                    }
                });
                return;
            }

            instances[canvasId] = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataValues,
                        backgroundColor: bgColors,
                        borderColor: '#0f172a',
                        borderWidth: 2,
                        hoverOffset: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: '#94a3b8',
                                font: { family: 'Inter', size: 11 },
                                boxWidth: 10,
                                padding: 12
                            }
                        },
                        tooltip: {
                            backgroundColor: '#0f172a',
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    const formatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
                                    return ` ${context.label}: ${formatted} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    };
})();
