// Set initial values
let totalDebt = 0;
let totalIncome = 8000;
let interestRate = 4;
let mortgageLength = 30;
let monthlyInterestRate = interestRate / 12;
let monthlyTaxesAndInsurance = 0;
let monthlyMortgagePayment = 0;
let downPayment = 20000;
let maxPrincipal = 0;

const iFactor = 0.28;
const dtiFactor = 0.36;

function parseCurrency(num) {
  return parseFloat(num.replace(/,?[a-zA-Z]?/g, "") || 0);
}

function formatCurrency(num) {
  if (isNaN(num)) {
    return parseFloat("0").toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatInput(input) {
  const f = parseFloat(input);
  console.log("F", f);
  if (isNaN(f)) {
    return parseFloat(0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
    });
  }
  return f.toLocaleString(undefined, { minimumFractionDigits: 0 });
}

function updateTotalIncome() {
  const wagesValue = parseCurrency(wages.value);

  const alimonyValue = parseCurrency(alimonyIncome.value);

  const investmentsValue = parseCurrency(investments.value);

  const otherValue = parseCurrency(otherIncome.value);

  // Calculate the total monthly income by adding up the values of all the income inputs
  totalIncome = wagesValue + alimonyValue + investmentsValue + otherValue;

  if (totalIncome > 0) {
    [wages, alimonyIncome, investments, otherIncome].forEach((input) => {
      input.classList.remove("error");
      totalMonthlyIncome.classList.remove("error-message");
    });
  }

  // Update the text content of the total monthly income element to display the new total
  totalMonthlyIncome.textContent = "$" + formatCurrency(totalIncome);
}

// Define a function to calculate the total debt and update the total monthly payment element
function updateTotalDebt() {
  const inputs = [carPayment, alimonyPaid, creditCardPayment, otherDebtPayment];
  const monthlyExpenses = inputs.reduce((total, input) => {
    const value = parseCurrency(input.value);
    total += value;
    return total;
  }, 0);

  // Calculate the total monthly taxes and homeowner's insurance by dividing the annual values by 12
  const taxesValue = parseCurrency(realEstateTaxes.value);
  const HIPaymentValue = parseCurrency(HIPayment.value);

  monthlyTaxesAndInsurance = (taxesValue + HIPaymentValue) / 12;

  // Add up the monthly expenses and taxes/insurance to get the total monthly debt payments
  totalDebt = monthlyExpenses + monthlyTaxesAndInsurance;

  // Update the text content of the total monthly payment element to display the new total
  totalMonthlyPayment.textContent = "$" + formatCurrency(totalDebt);
}

function updateHomeInfo() {
  interestRate = (parseCurrency(interestRateInput.value) || 0) / 100;
  mortgageLength = parseCurrency(loanTermInput.value);
  monthlyInterestRate = interestRate / 12;
  downPayment = parseCurrency(downPaymentInput.value);
}

function calculateEverything() {
  document.getElementById("endResult").style.display = "block";

  // update values one more time
  updateTotalIncome();
  updateTotalDebt();

  const inputsRequiredForIncome = [
    wages,
    alimonyIncome,
    investments,
    otherIncome,
  ];
  if (totalIncome === 0) {
    inputsRequiredForIncome.forEach((input) => {
      input.classList.add("error");
      totalMonthlyIncome.classList.add("error-message");
      totalMonthlyIncome.textContent =
        "$" +
        formatCurrency(totalIncome) +
        " -- Please enter at least one income source.";
    });
  } else {
    inputsRequiredForIncome.forEach((input) => {
      totalMonthlyIncome.classList.remove("error-message");
      input.classList.remove("error");
    });
  }

  if (interestRate == 0) {
    interestRateInput.classList.add("error");
    interestRateErrorMessage.classList.add("active");
    interestRateErrorMessage.innerText = "Please enter a valid interest rate.";
  } else {
    interestRateInput.classList.remove("error");
    interestRateErrorMessage.classList.remove("active");
    interestRateErrorMessage.innerText = "";
  }

  if (mortgageLength == 0) {
    loanTermInput.classList.add("error");
    loanTermErrorMessage.classList.add("active");
    loanTermErrorMessage.innerText = "Please enter a valid loan term.";
  } else {
    loanTermInput.classList.remove("error");
    loanTermErrorMessage.classList.remove("active");
    loanTermErrorMessage.innerText = "";
  }

  // set all text fields to 0 if they are empty

  allInputs.forEach((input) => {
    if (input.value === "") {
      if (input.name == "loanTerm") {
        input.value = 0;
        return;
      }
      input.value = formatCurrency(NaN);
    }
  });

  // Calculate disposable income
  const disposableIncome = totalIncome - totalDebt;
  const disposableIncomeElement = document.querySelector(".disposable-income");
  disposableIncomeElement.textContent = `Disposable Income: ${formatCurrency(
    disposableIncome
  )}`;

  // Calculate debt-to-income ratio
  let debtToIncomeRatio;
  if (totalIncome === 0) {
    // avoid divide by zero
    debtToIncomeRatio = 0;
  } else {
    debtToIncomeRatio = (totalDebt / totalIncome) * 100;
  }
  const debtToIncomeRatioElement = document.querySelector(
    ".debt-to-income-ratio"
  );
  debtToIncomeRatioElement.textContent =
    totalIncome === 0
      ? `Debt-to-Income Ratio: N/A -- We can't calculate this without knowing your income.`
      : `Debt-to-Income Ratio: ${formatCurrency(debtToIncomeRatio)}%`;

  const incomeProportion = totalIncome * iFactor;
  const debtProportion = totalIncome * dtiFactor - totalDebt;

  const maxMonthlyMortgage =
    incomeProportion < debtProportion ? incomeProportion : debtProportion;

  maxMonthlyMortgageElement.textContent = `Max Monthly Mortgage Payment: $${formatCurrency(
    maxMonthlyMortgage
  )}`;

  // Calculate max house price
  // P = M [ (1 + r)^n - 1] / [ r(1 + r)^n ]
  // M = monthly mortgage payment
  // P = principal, or the max house price in this case
  // r = monthly interest rate
  // n = number of payments
  const c = Math.pow(1 + monthlyInterestRate, mortgageLength * 12);
  const maxHousePrice =
    incomeProportion < debtProportion
      ? ((maxMonthlyMortgage - monthlyTaxesAndInsurance) * (c - 1)) /
        (monthlyInterestRate * c)
      : (maxMonthlyMortgage * (c - 1)) / (monthlyInterestRate * c);

  // const maxHousePrice = totalMortgagePaid - downPayment;

  console.table({
    maxMonthlyMortgage,
    monthlyInterestRate,
    monthlyTaxesAndInsurance,
    mortgageLength,
    maxHousePrice,
    totalIncome,
    totalDebt,
    incomeProportion,
    debtProportion,
    interestRate,
    incomeLessThanDebt: incomeProportion < debtProportion,
    // totalMortgagePaid,
    // totalInterestPaid,
    num1: Math.pow(1 + monthlyInterestRate, mortgageLength) - 1,
    den1:
      monthlyInterestRate * Math.pow(1 + monthlyInterestRate, mortgageLength),
    div1:
      (Math.pow(1 + monthlyInterestRate, mortgageLength) - 1) /
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, mortgageLength)),
  });

  let maxHousePriceElementText = `Max Affordable House Price: $${formatCurrency(
    maxHousePrice + downPayment
  )}`;

  if (isNaN(maxHousePrice)) {
    maxHousePriceElementText =
      "Max Affordable House Price: N/A -- We can't calculate this without knowing more about your income and debt.";
  }

  if (!isNaN(maxHousePrice) && !isNaN(downPayment) && downPayment > 0) {
    const remainingBalance = maxHousePrice - downPayment;
    maxHousePriceElementText += ` (including down payment of $${formatCurrency(
      downPayment
    )}; remaining balance of $${formatCurrency(maxHousePrice)})`;
  }

  const maxHousePriceElement = document.querySelector(".max-house-price");
  maxHousePriceElement.textContent = maxHousePriceElementText;
}

/** DOM nodes for getting and updating total income */
const wages = document.getElementById("wages");
const alimonyIncome = document.getElementById("alimonyIncome");
const investments = document.getElementById("investments");
const otherIncome = document.getElementById("otherIncome");

const totalMonthlyIncome = document.querySelector(
  "#total-monthly-income-value"
);

/** DOM nodes for getting and updating total debt */
const carPayment = document.getElementById("carPayment");
const alimonyPaid = document.getElementById("alimonyPaid");
const creditCardPayment = document.getElementById("creditCardPayment");
const otherDebtPayment = document.getElementById("otherDebtPayment");
const realEstateTaxes = document.getElementById("realEstateTaxes");
const HIPayment = document.getElementById("homeownerInsurance");

const totalMonthlyPayment = document.querySelector(".monthlyTotal");

// Get a reference to the "Calculate" button
const calculateButton = document.getElementById("calculateButton");

// Add an event listener to run the calculation when it's clicked down
calculateButton.addEventListener("click", calculateEverything);

const maxMonthlyMortgageElement = document.querySelector(
  ".max-monthly-mortgage"
);

const wagesInput = document.getElementById("wages");
const wagesErrorMessage = document.getElementById("wages-error-message");

wagesInput.addEventListener("input", function () {
  const wages = wagesInput.value.replace(/,/g, ""); // Remove commas from input
  if (wages > 9999999) {
    wagesErrorMessage.innerText =
      "Wages must be less than or equal to 9,999,999";
    wagesErrorMessage.classList.add("active");
    wagesInput.classList.add("error");
  } else {
    wagesErrorMessage.innerText = "";
    wagesErrorMessage.classList.remove("active");
    wagesInput.classList.remove("error");
  }
});

const investmentsInput = document.getElementById("investments");
const investmentErrorMessage = document.getElementById(
  "investments-error-message"
);

investmentsInput.addEventListener("input", function () {
  const investments = investmentsInput.value.replace(/,/g, ""); // Remove commas from input
  if (investments > 9999999) {
    investmentErrorMessage.innerText =
      "Investments must be less than or equal to 9,999,999";
    investmentErrorMessage.classList.add("active");
    investmentsInput.classList.add("error");
  } else {
    investmentErrorMessage.innerText = "";
    investmentErrorMessage.classList.remove("active");
    investmentsInput.classList.remove("error");
  }
});

const alimonyInput = document.getElementById("alimonyIncome");
const alimonyErrorMessage = document.getElementById("alimony-error-message");

alimonyInput.addEventListener("input", function () {
  const investments = alimonyInput.value.replace(/,/g, ""); // Remove commas from input
  if (investments > 9999999) {
    alimonyErrorMessage.innerText =
      "Alimony must be less than or equal to 9,999,999";
    alimonyErrorMessage.classList.add("active");
    alimonyInput.classList.add("error");
  } else {
    alimonyErrorMessage.innerText = "";
    alimonyErrorMessage.classList.remove("active");
    alimonyInput.classList.remove("error");
  }
});

const otherIncInput = document.getElementById("otherIncome");
const otherIncErrorMessage = document.getElementById(
  "other-income-error-message"
);

otherIncInput.addEventListener("input", function () {
  const investments = otherIncInput.value.replace(/,/g, ""); // Remove commas from input
  if (investments > 9999999) {
    otherIncErrorMessage.innerText =
      "Other income must be less than or equal to 9,999,999";
    otherIncErrorMessage.classList.add("active");
    otherIncInput.classList.add("error");
  } else {
    otherIncErrorMessage.innerText = "";
    otherIncErrorMessage.classList.remove("active");
    otherIncInput.classList.remove("error");
  }
});

const downPaymentInput = document.getElementById("downPayment");
const downPaymentErrorMessage = document.getElementById(
  "downpayment-error-message"
);

downPaymentInput.addEventListener("input", function () {
  const investments = downPaymentInput.value.replace(/,/g, ""); // Remove commas from input
  if (investments > 9999999) {
    downPaymentErrorMessage.innerText =
      "Down payment must be less than or equal to 9,999,999";
    downPaymentErrorMessage.classList.add("active");
    downPaymentInput.classList.add("error");
  } else {
    downPaymentErrorMessage.innerText = "";
    downPaymentErrorMessage.classList.remove("active");
    downPaymentInput.classList.remove("error");
  }
});

const realEstateTaxInput = document.getElementById("realEstateTaxes");
const realEstateErrorMessage = document.getElementById(
  "real-estate-error-message"
);

realEstateTaxInput.addEventListener("input", function () {
  const investments = realEstateTaxInput.value.replace(/,/g, ""); // Remove commas from input
  if (investments > 9999999) {
    realEstateErrorMessage.innerText =
      "Real estate taxes must be less than or equal to 9,999,999";
    realEstateErrorMessage.classList.add("active");
    realEstateTaxInput.classList.add("error");
  } else {
    realEstateErrorMessage.innerText = "";
    realEstateErrorMessage.classList.remove("active");
    realEstateTaxInput.classList.remove("error");
  }
});

const interestRateInput = document.getElementById("interestRate");
const interestRateErrorMessage = document.getElementById(
  "interest-rate-error-message"
);

interestRateInput.addEventListener("input", function () {
  const investments = interestRateInput.value;
  if (investments > 10) {
    interestRateErrorMessage.innerText =
      "Interest rate must be between 0 and 10%";
    interestRateErrorMessage.classList.add("active");
    interestRateInput.classList.add("error");
  } else {
    interestRateErrorMessage.innerText = "";
    interestRateErrorMessage.classList.remove("active");
    interestRateInput.classList.remove("error");
  }
});

const loanTermInput = document.getElementById("loanTerm");
const loanTermErrorMessage = document.getElementById("loan-term-error-message");

loanTermInput.addEventListener("input", function () {
  const investments = loanTermInput.value;
  if (investments > 99) {
    loanTermErrorMessage.innerText = "Loan term must be between 1 and 99 years";
    loanTermErrorMessage.classList.add("active");
    loanTermInput.classList.add("error");
  } else {
    loanTermErrorMessage.innerText = "";
    loanTermErrorMessage.classList.remove("active");
    loanTermInput.classList.remove("error");
  }
});

const insuranceInput = document.getElementById("homeownerInsurance");
const insuranceErrorMessage = document.getElementById(
  "insurance-error-message"
);

insuranceInput.addEventListener("input", function () {
  const investments = insuranceInput.value.replace(/,/g, ""); // Remove commas from input
  if (investments > 9999999) {
    insuranceErrorMessage.innerText =
      "Homeowners insurance taxes must be less than or equal to 9,999,999";
    insuranceErrorMessage.classList.add("active");
    insuranceInput.classList.add("error");
  } else {
    insuranceErrorMessage.innerText = "";
    insuranceErrorMessage.classList.remove("active");
    insuranceInput.classList.remove("error");
  }
});

const carPaymentInput = document.getElementById("carPayment");
const carPaymentErrorMessage = document.getElementById(
  "car-payment-error-message"
);

carPaymentInput.addEventListener("input", function () {
  const investments = carPaymentInput.value.replace(/,/g, ""); // Remove commas from input
  if (investments > 9999999) {
    carPaymentErrorMessage.innerText =
      "Car payments must be less than or equal to 9,999,999";
    carPaymentErrorMessage.classList.add("active");
    carPaymentInput.classList.add("error");
  } else {
    carPaymentErrorMessage.innerText = "";
    carPaymentErrorMessage.classList.remove("active");
    carPaymentInput.classList.remove("error");
  }
});

const creditCardInput = document.getElementById("creditCardPayment");
const creditCardErrorMessage = document.getElementById(
  "credit-card-payment-error-message"
);

creditCardInput.addEventListener("input", function () {
  const investments = creditCardInput.value.replace(/,/g, ""); // Remove commas from input
  if (investments > 9999999) {
    creditCardErrorMessage.innerText =
      "Homeowners insurance taxes must be less than or equal to 9,999,999";
    creditCardErrorMessage.classList.add("active");
    creditCardInput.classList.add("error");
  } else {
    creditCardErrorMessage.innerText = "";
    creditCardErrorMessage.classList.remove("active");
    creditCardInput.classList.remove("error");
  }
});

const alimonyPaymentInput = document.getElementById("alimonyPaid");
const alimonyPaymentErrorMessage = document.getElementById(
  "alimony-payment-error-message"
);

alimonyPaymentInput.addEventListener("input", function () {
  const investments = alimonyPaymentInput.value.replace(/,/g, ""); // Remove commas from input
  if (investments > 9999999) {
    alimonyPaymentErrorMessage.innerText =
      "Homeowners insurance taxes must be less than or equal to 9,999,999";
    alimonyPaymentErrorMessage.classList.add("active");
    alimonyPaymentInput.classList.add("error");
  } else {
    alimonyPaymentErrorMessage.innerText = "";
    alimonyPaymentErrorMessage.classList.remove("active");
    alimonyPaymentInput.classList.remove("error");
  }
});

const otherDebtInput = document.getElementById("otherDebtPayment");
const otherDebtErrorMessage = document.getElementById(
  "other-debts-error-message"
);

otherDebtInput.addEventListener("input", function () {
  const investments = otherDebtInput.value.replace(/,/g, ""); // Remove commas from input
  if (investments > 9999999) {
    otherDebtErrorMessage.innerText =
      "Homeowners insurance taxes must be less than or equal to 9,999,999";
    otherDebtErrorMessage.classList.add("active");
    otherDebtInput.classList.add("error");
  } else {
    otherDebtErrorMessage.innerText = "";
    otherDebtErrorMessage.classList.remove("active");
    otherDebtInput.classList.remove("error");
  }
});

// function formatCurrency(input) {
//   // Strip out non-digits
//   const number = input.value.replace(/[^0-9]/g, "");

//   // Format the number with commas
//   const formattedNumber = number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

//   // Set the formatted value back into the input field
//   input.value = formattedNumber;
// }

// Get all input elements with class 'currency'
// const currencyInputs = document.querySelectorAll(".currency");

// // Loop through each input element
// currencyInputs.forEach((input) => {
//   // Add event listener for 'input' event
//   input.addEventListener("input", (e) => {
//     // Remove all non-numeric characters
//     let value = e.target.value.replace(/[^0-9.]/g, "");

//     // Add commas for thousands separator
//     value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

//     // Update input value
//     e.target.value = value;
//   });
// });

const button = document.querySelector(".Button.Button--primary");
const buttonInputs = [
  {
    input: document.getElementById("wages"),
    error: document.getElementById("wages-error-message"),
  },
  {
    input: document.getElementById("investments"),
    error: document.getElementById("investments-error-message"),
  },
  {
    input: document.getElementById("alimonyIncome"),
    error: document.getElementById("alimony-error-message"),
  },
  {
    input: document.getElementById("otherIncome"),
    error: document.getElementById("other-income-error-message"),
  },
  {
    input: document.getElementById("downPayment"),
    error: document.getElementById("downpayment-error-message"),
  },
  {
    input: document.getElementById("realEstateTaxes"),
    error: document.getElementById("real-estate-error-message"),
  },
  {
    input: document.getElementById("interestRate"),
    error: document.getElementById("interest-rate-error-message"),
  },
  {
    input: document.getElementById("loanTerm"),
    error: document.getElementById("loan-term-error-message"),
  },
  {
    input: document.getElementById("homeownerInsurance"),
    error: document.getElementById("insurance-error-message"),
  },
];

buttonInputs.forEach(({ input, error }) => {
  if (buttonInputs.some(({ error }) => error.classList.contains("active"))) {
    button.disabled = true;
  } else {
    button.disabled = false;
  }
});

const allInputs = [
  wages,
  alimonyIncome,
  investments,
  otherIncome,
  downPaymentInput,
  loanTermInput,
  realEstateTaxInput,
  HIPayment,
  interestRateInput,
  carPayment,
  alimonyPaid,
  creditCardPayment,
  otherDebtPayment,
];

allInputs.forEach((input) => {
  input.addEventListener("click", (ev) => {
    // select all content
    ev.target.select();
  });

  input.addEventListener("keyup", (ev) => {
    setTimeout(() => {
      const parts = ev.target.value.split(".");
      const val = parts[0].replace(/\D/g, "");
      const dec = parts[1];
      console.log(val, dec);
      const num = val + (dec != null ? "." + dec : "");

      console.log(ev.target, num, formatInput(val));

      ev.target.value = formatInput(val) + (dec != null ? "." + dec : "");
    });
    updateTotalIncome();
    updateTotalDebt();
    updateHomeInfo();
  });
});

// re-calculate everything once on page load
updateTotalIncome();
updateTotalDebt();
updateHomeInfo();
