// Shared option lists for profile / application forms.

export const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador",
  "Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
  "Guyana","Haiti","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati",
  "Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein",
  "Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania",
  "Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
  "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia",
  "Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines",
  "Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines",
  "Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia",
  "Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname",
  "Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga",
  "Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States",
  "Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

// Common UTC offsets — enough to schedule sessions across regions without a
// full IANA database. Value is the label the user picks.
export const TIMEZONES = [
  "UTC−12:00","UTC−11:00","UTC−10:00 (Hawaii)","UTC−09:00 (Alaska)","UTC−08:00 (Pacific)",
  "UTC−07:00 (Mountain)","UTC−06:00 (Central)","UTC−05:00 (Eastern)","UTC−04:00 (Atlantic)","UTC−03:00 (São Paulo)",
  "UTC−02:00","UTC−01:00","UTC±00:00 (London)","UTC+01:00 (Central Europe)","UTC+02:00 (Eastern Europe)",
  "UTC+03:00 (Moscow)","UTC+04:00 (Dubai)","UTC+05:00 (Pakistan)","UTC+05:30 (India)","UTC+06:00 (Bangladesh)",
  "UTC+07:00 (Bangkok)","UTC+08:00 (Singapore)","UTC+09:00 (Tokyo)","UTC+10:00 (Sydney)","UTC+11:00","UTC+12:00 (Auckland)",
];

// Markets a trader follows — used for context and future mentor matching.
export const TRADING_MARKETS = ["Futures", "Forex", "Crypto", "Options", "Stocks", "Indices", "Commodities"];
