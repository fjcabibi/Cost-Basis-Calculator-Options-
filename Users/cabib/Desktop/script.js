class OptionsCalculatorApp {
    constructor() {
        this.currentTab = "basic-calculator";
        this.init();
    }

    init() {
        this.initTabNavigation();
        this.initSidebarToggle();
        this.initCalculators();
        this.initTickerValidation();
        this.initPremiumToggle();
        this.initSpreadCalculation();
    }

    initTabNavigation() {
        const navLinks = document.querySelectorAll(".nav-link");
        navLinks.forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const tabId = link.getAttribute("data-tab");
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Remove active class from all tabs and nav links
        document.querySelectorAll(".tab-content").forEach(tab => {
            tab.classList.remove("active");
        });
        document.querySelectorAll(".nav-link").forEach(link => {
            link.classList.remove("active");
        });

        // Add active class to selected tab and nav link
        document.getElementById(tabId).classList.add("active");
        document.querySelector(`[data-tab="${tabId}"]`).classList.add("active");
        this.currentTab = tabId;
    }

    initSidebarToggle() {
        const sidebarToggle = document.getElementById("sidebarToggle");
        const sidebar = document.querySelector(".sidebar");
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener("click", () => {
                sidebar.classList.toggle("open");
            });
        }
    }

    initCalculators() {
        new CostBasisCalculator();
        new BearPutSpreadCalculator();
        new SellPutCalculator();
    }

    initTickerValidation() {
        const tickerInputs = document.querySelectorAll("#tickerSymbol, #spreadTickerSymbol");
        
        tickerInputs.forEach(input => {
            input.addEventListener("input", (e) => {
                // Convert to uppercase and remove non-alphanumeric characters
                let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                
                // Limit to 5 characters
                if (value.length > 5) {
                    value = value.substring(0, 5);
                }
                
                e.target.value = value;
                
                // Visual validation feedback
                if (value.length > 0) {
                    e.target.style.borderColor = "#38a169";
                } else {
                    e.target.style.borderColor = "#e2e8f0";
                }
            });
        });
    }

    initPremiumToggle() {
        const totalPremiumInput = document.getElementById("totalContractPremium");
        const individualPricesRow = document.getElementById("individualPricesRow");
        const longPutPriceInput = document.getElementById("longPutPrice");
        const shortPutPriceInput = document.getElementById("shortPutPrice");

        if (totalPremiumInput && individualPricesRow) {
            totalPremiumInput.addEventListener("input", () => {
                const hasTotalPremium = totalPremiumInput.value && parseFloat(totalPremiumInput.value) > 0;
                
                if (hasTotalPremium) {
                    individualPricesRow.classList.add("conditional");
                    longPutPriceInput.disabled = true;
                    shortPutPriceInput.disabled = true;
                } else {
                    individualPricesRow.classList.remove("conditional");
                    longPutPriceInput.disabled = false;
                    shortPutPriceInput.disabled = false;
                }
            });
        }
    }

    initSpreadCalculation() {
        const inputs = ["longPutStrike", "shortPutStrike", "totalContractPremium", "contracts"];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener("input", () => {
                    this.updateSpreadCalculation();
                });
            }
        });
    }

    updateSpreadCalculation() {
        const longPutStrike = parseFloat(document.getElementById("longPutStrike").value) || 0;
        const shortPutStrike = parseFloat(document.getElementById("shortPutStrike").value) || 0;
        const totalContractPremium = parseFloat(document.getElementById("totalContractPremium").value) || 0;
        const contracts = parseInt(document.getElementById("contracts").value) || 0;

        if (longPutStrike > 0 && shortPutStrike > 0 && contracts > 0) {
            const spreadWidth = shortPutStrike - longPutStrike;
            const totalSpreadValue = spreadWidth * 100 * contracts;
            const netProfitPotential = totalContractPremium;
            const maxRisk = totalSpreadValue - totalContractPremium;

            // Update calculated fields
            document.getElementById("spreadWidth").textContent = `$${spreadWidth.toFixed(2)}`;
            document.getElementById("netProfitPotential").textContent = `$${netProfitPotential.toFixed(2)}`;
            document.getElementById("maxRisk").textContent = `$${maxRisk.toFixed(2)}`;

            // Visual validation for strike prices
            const longStrikeInput = document.getElementById("longPutStrike");
            const shortStrikeInput = document.getElementById("shortPutStrike");
            
            if (shortPutStrike > longPutStrike) {
                longStrikeInput.style.borderColor = "#38a169";
                shortStrikeInput.style.borderColor = "#38a169";
            } else {
                longStrikeInput.style.borderColor = "#e53e3e";
                shortStrikeInput.style.borderColor = "#e53e3e";
            }
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(amount);
    }
}

class CostBasisCalculator {
    constructor() {
        this.form = document.getElementById("costBasisForm");
        this.resultsSection = document.getElementById("resultsSection");
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener("submit", (e) => this.handleSubmit(e));
            this.setDefaultDate();
        }
    }

    setDefaultDate() {
        const expirationInput = document.getElementById("expirationDate");
        if (expirationInput) {
            const today = new Date();
            const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
            const formattedDate = thirtyDaysFromNow.toISOString().split("T")[0];
            expirationInput.value = formattedDate;
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        this.calculateCostBasis();
    }

    calculateCostBasis() {
        const tickerSymbol = document.getElementById("tickerSymbol").value.trim().toUpperCase();
        const purchasePrice = parseFloat(document.getElementById("purchasePrice").value);
        const quantity = parseInt(document.getElementById("quantity").value);
        const commission = parseFloat(document.getElementById("commission").value) || 0;
        const strikePrice = parseFloat(document.getElementById("strikePrice").value);
        const expirationDate = document.getElementById("expirationDate").value;

        if (!this.validateInputs(tickerSymbol, purchasePrice, quantity, strikePrice, expirationDate)) {
            return;
        }

        // Calculate cost basis
        const totalCost = (purchasePrice * quantity) + commission;
        const costPerShare = totalCost / quantity;
        const breakEvenPrice = strikePrice + costPerShare;

        // Calculate days to expiration
        const today = new Date();
        const expiration = new Date(expirationDate);
        const daysToExpiration = Math.ceil((expiration - today) / (1000 * 60 * 60 * 24));

        this.updateResults(tickerSymbol, totalCost, costPerShare, breakEvenPrice, daysToExpiration);
    }

    validateInputs(tickerSymbol, purchasePrice, quantity, strikePrice, expirationDate) {
        if (!tickerSymbol || tickerSymbol.length === 0) {
            this.showError("Please enter a ticker symbol");
            return false;
        } else if (tickerSymbol.length > 5) {
            this.showError("Ticker symbol must be 5 characters or less");
            return false;
        }

        if (purchasePrice <= 0) this.showError("Purchase price must be greater than 0");
        if (quantity <= 0) this.showError("Quantity must be greater than 0");
        if (strikePrice <= 0) this.showError("Strike price must be greater than 0");
        if (!expirationDate) this.showError("Please select an expiration date");

        return true;
    }

    updateResults(tickerSymbol, totalCost, costPerShare, breakEvenPrice, daysToExpiration) {
        // Update the header to show the ticker symbol
        const header = document.querySelector("#basic-calculator .header .title");
        if (header) {
            header.textContent = `${tickerSymbol} - Cost Basis Calculator`;
        }

        document.getElementById("totalCostBasis").textContent = this.formatCurrency(totalCost);
        document.getElementById("costPerShare").textContent = this.formatCurrency(costPerShare);
        document.getElementById("breakEvenPrice").textContent = this.formatCurrency(breakEvenPrice);
        document.getElementById("daysToExpiration").textContent = daysToExpiration;

        this.resultsSection.style.display = "block";
        this.resultsSection.scrollIntoView({ behavior: "smooth" });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(amount);
    }

    showError(message) {
        alert(message);
    }
}

class BearPutSpreadCalculator {
    constructor() {
        this.form = document.getElementById("bearPutForm");
        this.resultsSection = document.getElementById("spreadResultsSection");
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener("submit", (e) => this.handleSubmit(e));
            this.setDefaultDate();
        }
    }

    setDefaultDate() {
        const expirationInput = document.getElementById("spreadExpiration");
        if (expirationInput) {
            const today = new Date();
            const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
            const formattedDate = thirtyDaysFromNow.toISOString().split("T")[0];
            expirationInput.value = formattedDate;
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        this.calculateSpread();
    }

    calculateSpread() {
        const longPutStrike = parseFloat(document.getElementById("longPutStrike").value);
        const shortPutStrike = parseFloat(document.getElementById("shortPutStrike").value);
        const contracts = parseInt(document.getElementById("contracts").value);
        const totalContractPremium = parseFloat(document.getElementById("totalContractPremium").value) || 0;

        // Basic validation for required fields
        if (isNaN(longPutStrike) || longPutStrike <= 0) {
            alert("Please enter a valid long put strike price");
            return;
        }

        if (isNaN(shortPutStrike) || shortPutStrike <= 0) {
            alert("Please enter a valid short put strike price");
            return;
        }

        if (isNaN(contracts) || contracts <= 0) {
            alert("Please enter a valid number of contracts");
            return;
        }

        // Validate that short put strike is higher than long put strike for bear put spread
        if (shortPutStrike <= longPutStrike) {
            alert("Short put strike must be higher than long put strike for a bear put spread");
            return;
        }

        // Calculate spread width
        const spreadWidth = shortPutStrike - longPutStrike;
        
        // Calculate total spread value (spread width * 100 * contracts)
        const totalSpreadValue = spreadWidth * 100 * contracts;

        // For bear put spread:
        // Net profit potential = total contract premium (what you receive)
        const netProfitPotential = totalContractPremium;

        // Max risk = spread width - total contract premium (what you can lose)
        const maxRisk = totalSpreadValue - totalContractPremium;

        // Update the calculated fields display
        document.getElementById("spreadWidth").textContent = `$${spreadWidth.toFixed(2)}`;
        document.getElementById("netProfitPotential").textContent = `$${netProfitPotential.toFixed(2)}`;
        document.getElementById("maxRisk").textContent = `$${maxRisk.toFixed(2)}`;

        // Show results section
        const resultsSection = document.getElementById("spreadResultsSection");
        if (resultsSection) {
            resultsSection.style.display = "block";
            resultsSection.scrollIntoView({ behavior: "smooth" });
        }

        // Update the spread analysis results
        this.updateSpreadResults({
            tickerSymbol: document.getElementById("spreadTickerSymbol").value.toUpperCase(),
            longPutStrike,
            shortPutStrike,
            spreadWidth,
            totalContractPremium,
            netProfitPotential,
            maxRisk,
            contracts
        });

        console.log("Spread calculated:", {
            longPutStrike,
            shortPutStrike,
            contracts,
            spreadWidth,
            totalSpreadValue,
            totalContractPremium,
            netProfitPotential,
            maxRisk
        });
    }

    updateSpreadResults(data) {
        const resultsContainer = document.getElementById("spreadResultsSection");
        
        // Calculate break-even price
        const breakEven = data.shortPutStrike - (data.totalContractPremium / 100);
        
        // Calculate max profit (net profit potential * 100 * contracts)
        const maxProfit = data.netProfitPotential * 100 * data.contracts;
        
        resultsContainer.innerHTML = `
            <div class="results-grid">
                <div class="result-card">
                    <h3>Max Profit</h3>
                    <div class="result-value success">$${maxProfit.toFixed(2)}</div>
                </div>
                <div class="result-card">
                    <h3>Max Loss</h3>
                    <div class="result-value error">$${data.maxRisk.toFixed(2)}</div>
                </div>
                <div class="result-card">
                    <h3>Break-Even Price</h3>
                    <div class="result-value">$${breakEven.toFixed(2)}</div>
                </div>
            </div>
            <div style="margin-top: 15px; padding: 10px; background: #f7fafc; border-radius: 8px; font-size: 0.85rem; color: #4a5568;">
                <strong>${data.tickerSymbol}</strong> Bear Put Spread: ${data.longPutStrike} Put / ${data.shortPutStrike} Put
                <br>Spread Width: $${data.spreadWidth.toFixed(2)} | Contracts: ${data.contracts}
            </div>
        `;

        // Show results section
        this.resultsSection.style.display = "block";
        this.resultsSection.scrollIntoView({ behavior: "smooth" });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(amount);
    }

    showError(message) {
        alert(message);
    }
}

class SellPutCalculator {
    constructor() {
        this.form = document.getElementById("sellPutForm");
        this.resultsSection = document.getElementById("sellPutResultsSection");
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener("submit", (e) => this.handleSubmit(e));
            this.setDefaultDate();
        }
    }

    setDefaultDate() {
        const expirationInput = document.getElementById("sellPutExpiration");
        if (expirationInput) {
            const today = new Date();
            const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
            const formattedDate = thirtyDaysFromNow.toISOString().split("T")[0];
            expirationInput.value = formattedDate;
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        this.calculateSellPut();
    }

    calculateSellPut() {
        const strikePrice = parseFloat(document.getElementById("putStrikePrice").value);
        const premium = parseFloat(document.getElementById("putPremium").value);

        if (isNaN(strikePrice) || strikePrice <= 0) {
            alert("Please enter a valid strike price");
            return;
        }

        if (isNaN(premium) || premium < 0) {
            alert("Please enter a valid premium (must be non-negative)");
            return;
        }

        // Calculate cost basis: Strike Price - Premium
        const costBasis = strikePrice - premium;

        this.updateSellPutResults(strikePrice, premium, costBasis);
    }

    updateSellPutResults(strikePrice, premium, costBasis) {
        const resultsContainer = document.getElementById("sellPutResultsSection");
        if (resultsContainer) {
            resultsContainer.style.display = "block";
            resultsContainer.scrollIntoView({ behavior: "smooth" });
        }

        document.getElementById("costBasis").textContent = this.formatCurrency(costBasis);

        console.log("Sell Put calculated:", {
            strikePrice,
            premium,
            costBasis
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(amount);
    }

    showError(message) {
        alert(message);
    }
}

class CalculatorUtils {
    static calculateProfitLoss(currentPrice, breakEvenPrice, optionType) {
        if (optionType === "call") {
            return currentPrice > breakEvenPrice ? currentPrice - breakEvenPrice : 0;
        } else {
            return currentPrice < breakEvenPrice ? breakEvenPrice - currentPrice : 0;
        }
    }

    static calculateTimeValue(optionPrice, intrinsicValue) {
        return Math.max(0, optionPrice - intrinsicValue);
    }

    static formatPercentage(value) {
        return `${(value * 100).toFixed(2)}%`;
    }

    static validateTickerSymbol(ticker) {
        const tickerRegex = /^[A-Z]{1,5}$/;
        return tickerRegex.test(ticker);
    }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    new OptionsCalculatorApp();
});

function addInputValidation() {
    const inputs = document.querySelectorAll("input[type=number]");
    inputs.forEach(input => {
        input.addEventListener("input", (e) => {
            const value = parseFloat(e.target.value);
            if (value < 0) {
                e.target.value = 0;
            }
        });
    });
}

// Add input validation
addInputValidation();
