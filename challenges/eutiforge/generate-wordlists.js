/**
 * Generates username and password wordlists for the EutiForge challenge.
 * Run: node generate-wordlists.js
 *
 * Valid credentials hidden in the lists:
 *   Email:    sofia.andersson@outlook.com  (position ~47)
 *   Password: Cr@ft3r$2024                (position ~283)
 */

const fs = require('fs');
const path = require('path');

const firstNames = [
  'james','mary','robert','patricia','john','jennifer','michael','linda','david','elizabeth',
  'william','barbara','richard','susan','joseph','jessica','thomas','sarah','charles','karen',
  'christopher','lisa','daniel','nancy','matthew','betty','anthony','margaret','mark','sandra',
  'donald','ashley','steven','dorothy','paul','kimberly','andrew','emily','joshua','donna',
  'kenneth','michelle','kevin','carol','brian','amanda','george','melissa','timothy','deborah',
  'ronald','stephanie','edward','rebecca','jason','sharon','jeffrey','laura','ryan','cynthia',
  'jacob','kathleen','gary','amy','nicholas','angela','eric','shirley','jonathan','anna',
  'stephen','brenda','larry','pamela','justin','emma','scott','nicole','brandon','helen',
  'benjamin','samantha','samuel','katherine','raymond','christine','gregory','debra','frank','rachel',
  'alexander','carolyn','patrick','janet','jack','catherine','dennis','maria','jerry','heather',
  'tyler','diane','aaron','ruth','jose','julie','adam','olivia','nathan','joyce',
  'henry','virginia','peter','victoria','zachary','kelly','douglas','lauren','harold','christina'
];

const lastNames = [
  'smith','johnson','williams','brown','jones','garcia','miller','davis','rodriguez','martinez',
  'hernandez','lopez','gonzalez','wilson','anderson','thomas','taylor','moore','jackson','martin',
  'lee','perez','thompson','white','harris','sanchez','clark','ramirez','lewis','robinson',
  'walker','young','allen','king','wright','scott','torres','nguyen','hill','flores',
  'green','adams','nelson','baker','hall','rivera','campbell','mitchell','carter','roberts',
  'gomez','phillips','evans','turner','diaz','parker','cruz','edwards','collins','reyes',
  'stewart','morris','morales','murphy','cook','rogers','gutierrez','ortiz','morgan','cooper',
  'peterson','bailey','reed','kelly','howard','ramos','kim','cox','ward','richardson',
  'watson','brooks','chavez','wood','james','bennett','gray','mendoza','ruiz','hughes',
  'price','alvarez','castillo','sanders','patel','myers','long','ross','foster','jimenez'
];

const domains = [
  'gmail.com','yahoo.com','hotmail.com','outlook.com','protonmail.com',
  'icloud.com','mail.com','aol.com','zoho.com','yandex.com'
];

const passwordBases = [
  'password','123456','qwerty','letmein','welcome','monkey','dragon','master','login','abc123',
  'admin','iloveyou','sunshine','princess','football','shadow','superman','trustno1','batman','access',
  'hello','charlie','donald','ginger','freedom','thunder','summer','winter','spring','autumn',
  'diamond','phoenix','falcon','eagle','panther','tiger','mustang','dallas','boston','matrix',
  'silver','golden','orange','purple','yellow','midnight','crystal','fantasy','digital','warrior',
  'hunter','ranger','marine','castle','garden','forest','river','ocean','mountain','valley',
  'rocket','cosmic','ninja','pirate','viking','knight','legend','champion','victory','glory'
];

const passwordSuffixes = [
  '!','@','#','$','1','2','3','12','23','99','01','2024','2023','!1','@2','#3',
  '!!','123','321','007','42','69','88','77','55','100','000'
];

const passwordPatterns = [
  (b,s) => b + s,
  (b,s) => b.charAt(0).toUpperCase() + b.slice(1) + s,
  (b,s) => b.toUpperCase() + s,
  (b,s) => b.charAt(0).toUpperCase() + b.slice(1) + s + s,
  (b,s) => b + s + b.charAt(0).toUpperCase(),
  (b,s) => s + b.charAt(0).toUpperCase() + b.slice(1),
  (b,s) => b.replace(/a/g,'@').replace(/e/g,'3').replace(/i/g,'1').replace(/o/g,'0') + s,
];

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateEmails() {
  const rng = seededRandom(42);
  const emails = new Set();

  while (emails.size < 99) {
    const first = firstNames[Math.floor(rng() * firstNames.length)];
    const last = lastNames[Math.floor(rng() * lastNames.length)];
    const domain = domains[Math.floor(rng() * domains.length)];
    const sep = ['.', '_', ''][Math.floor(rng() * 3)];
    const num = rng() > 0.6 ? Math.floor(rng() * 99) : '';
    const email = `${first}${sep}${last}${num}@${domain}`;
    emails.add(email);
  }

  const list = Array.from(emails);
  // Insert valid email at position 47
  list.splice(47, 0, 'sofia.andersson@outlook.com');
  return list.slice(0, 100);
}

function generatePasswords() {
  const rng = seededRandom(1337);
  const passwords = new Set();

  while (passwords.size < 499) {
    const base = passwordBases[Math.floor(rng() * passwordBases.length)];
    const suffix = passwordSuffixes[Math.floor(rng() * passwordSuffixes.length)];
    const pattern = passwordPatterns[Math.floor(rng() * passwordPatterns.length)];
    const pw = pattern(base, suffix);
    if (pw.length >= 6) {
      passwords.add(pw);
    }
  }

  const list = Array.from(passwords);
  // Insert valid password at position 283
  list.splice(283, 0, 'Cr@ft3r$2024');
  return list.slice(0, 500);
}

// Generate and write
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const emails = generateEmails();
const passwords = generatePasswords();

fs.writeFileSync(path.join(dataDir, 'usernames.txt'), emails.join('\n') + '\n');
fs.writeFileSync(path.join(dataDir, 'passwords.txt'), passwords.join('\n') + '\n');

console.log(`[+] Generated ${emails.length} usernames -> data/usernames.txt`);
console.log(`[+] Generated ${passwords.length} passwords -> data/passwords.txt`);
console.log(`[+] Valid: sofia.andersson@outlook.com / Cr@ft3r$2024`);
