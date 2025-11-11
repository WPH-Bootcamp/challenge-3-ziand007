// ============================================
// HABIT TRACKER CLI - CHALLENGE 3
// ============================================
// NAMA: Raymond
// KELAS: Batch Rep 3
// TANGGAL: 11 November 2025
// ============================================

// TODO: Import module yang diperlukan
// HINT: readline, fs, path

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'habits-data.json');
const REMINDER_INTERVAL = 10000; // 10 detik
const DAYS_IN_WEEK = 7;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

function formatDateISO(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString(); //format tanggal
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Senin, ...
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function asciiProgressBar(percentage, width = 10) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${Math.round(percentage)}%`;
}

function idGenerator() {
  return Math.random().toString(36).slice(2, 9);
}

// Profil User
const defaultProfile = {
  name: 'User',
  createdAt: formatDateISO(),
};

class UserProfile {
  constructor(data = {}) {
    this.name = data.name ?? defaultProfile.name;
    this.createdAt = data.createdAt ?? defaultProfile.createdAt;
    this.notes = data.notes ?? '';
  }

  updateStats(habits = []) {
    const total = habits.length;
    const completedThisWeek = habits.filter((h) =>
      h.isCompletedThisWeek()
    ).length; // fungsi filter()
    const active = total - completedThisWeek;
    return { total, completedThisWeek, active };
  }

  getDaysJoined() {
    const created = new Date(this.createdAt);
    const diffMs = Date.now() - created.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
}

// class Habit
class Habit {
  constructor({
    id = null,
    name = 'Unnamed Habit',
    targetFrequency = 3,
    completions = [],
    createdAt = null,
  } = {}) {
    this.id = id ?? idGenerator();
    this.name = name;
    this.targetFrequency = Number(targetFrequency) || 1;
    this.completions = completions || [];
    this.createdAt = createdAt ?? formatDateISO();
  }

  // Tandai habit / kebiasaan yang telah selesai
  markComplete() {
    const today = formatDateISO();
    const exists = this.completions.find((d) => d === today); // Gunakan fungsi find()
    if (!exists) {
      this.completions.push(today);
      return true;
    }
    return false; // kondisi ketika sudah tertandai
  }

  // Dapatkan yang sudah terselesaikan dalam minggu ini
  getThisWeekCompletions() {
    const weekStart = startOfWeek(new Date());
    return this.completions.filter((dateStr) => {
      const d = new Date(dateStr);
      return d >= weekStart;
    });
  }

  isCompletedThisWeek() {
    return this.getThisWeekCompletions().length >= this.targetFrequency;
  }

  getProgressPercentage() {
    const completed = this.getThisWeekCompletions().length;
    const pct = (completed / this.targetFrequency) * 100;
    return Math.min(100, pct);
  }

  getStatus() {
    return this.isCompletedThisWeek() ? 'Selesai' : 'Aktif';
  }
}

// Class Tracker
class HabitTracker {
  constructor() {
    this.user = new UserProfile();
    this.habits = [];
    this.reminderTimer = null;
    this.loadFromFile();
  }

  // Fungsi CRUD
  addHabit(name, frequency) {
    const newHabit = new Habit({
      name: name ?? 'Unnamed',
      targetFrequency: frequency ?? 1,
    }); // ?? used
    this.habits.push(newHabit);
    this.saveToFile();
    return newHabit;
  }

  completeHabit(habitIndex) {
    const habit = this.habits[habitIndex - 1] ?? null;
    if (!habit) return { ok: false, msg: 'Habit tidak ditemukan' };
    const changed = habit.markComplete();
    if (changed) this.saveToFile();
    return { ok: changed, habit };
  }

  deleteHabit(habitIndex) {
    const habit = this.habits[habitIndex - 1] ?? null;
    if (!habit) return false;
    this.habits.splice(habitIndex - 1, 1);
    this.saveToFile();
    return true;
  }

  // Fungsi Menampilkan Profil
  displayProfile() {
    console.log('\n==================================================');
    console.log('PROFILE USER');
    console.log('==================================================');
    console.log(`Nama       : ${this.user.name}`);
    console.log(`Bergabung  : ${new Date(this.user.createdAt).toDateString()}`);
    console.log(`Hari bergabung: ${this.user.getDaysJoined()} hari`);
    const stats = this.user.updateStats(this.habits);
    console.log(`Total habits    : ${stats.total}`);
    console.log(`Selesai minggu ini: ${stats.completedThisWeek}`);
    console.log(`Aktif minggu ini   : ${stats.active}`);
    console.log('==================================================\n');
  }

  displayHabits(filter = 'all') {
    console.log('\n==================================================');
    console.log('DAFTAR HABITS');
    console.log('==================================================');
    let toShow = this.habits;
    if (filter === 'active') {
      toShow = this.habits.filter((h) => !h.isCompletedThisWeek());
    } else if (filter === 'completed') {
      toShow = this.habits.filter((h) => h.isCompletedThisWeek());
    }

    if (toShow.length === 0) {
      console.log('Tidak ada habit untuk ditampilkan.');
    }

    toShow.forEach((h, idx) => {
      const completed = h.getThisWeekCompletions().length;
      const pct = h.getProgressPercentage();
      console.log(`\n${idx + 1}. [${h.getStatus()}] ${h.name}`);
      console.log(`   Target: ${h.targetFrequency}x/minggu`);
      console.log(
        `   Progress: ${completed}/${h.targetFrequency} (${Math.round(pct)}%)`
      );
      console.log(`   Progress Bar: ${asciiProgressBar(pct, 10)}`);
    });

    console.log('\n==================================================\n');
  }

  displayHabitsWithWhile() {
    console.log('\n--- Demo While Loop ---');
    let i = 0;
    while (i < this.habits.length) {
      const h = this.habits[i];
      console.log(`${i + 1}. ${h.name} - ${h.getStatus()}`);
      i++;
    }
    console.log('--- End While Loop ---\n');
  }

  displayHabitsWithFor() {
    console.log('\n--- Demo For Loop ---');
    for (let i = 0; i < this.habits.length; i++) {
      const h = this.habits[i];
      console.log(`${i + 1}. ${h.name} - ${h.getStatus()}`);
    }
    console.log('--- End For Loop ---\n');
  }

  displayStats() {
    console.log('\n==================================================');
    console.log('STATISTIK');
    console.log('==================================================');

    // Gunakan fungsi map() untuk dapatkan habit
    const names = this.habits.map((h) => h.name);
    console.log('Nama habits: ' + (names.join(', ') || '-'));

    // fungsi filter() untuk menampilkan habit yang aktif dan selesai
    const active = this.habits.filter((h) => !h.isCompletedThisWeek());
    const completed = this.habits.filter((h) => h.isCompletedThisWeek());

    this.habits.forEach((h, idx) => {
      const c = h.getThisWeekCompletions().length;
      console.log(
        `${idx + 1}. ${h.name} => ${c}/${h.targetFrequency} (${h.getStatus()})`
      );
    });

    console.log('\nRingkasan:');
    console.log(`Total habits: ${this.habits.length}`);
    console.log(`Aktif minggu ini: ${active.length}`);
    console.log(`Selesai minggu ini: ${completed.length}`);
    console.log('==================================================\n');
  }

  // Fungsi reminder
  startReminder() {
    if (this.reminderTimer) return;
    this.reminderTimer = setInterval(
      () => this.showReminder(),
      REMINDER_INTERVAL
    );
  }

  showReminder() {
    const activeHabit = this.habits.find((h) => !h.isCompletedThisWeek());
    if (!activeHabit) return;

    console.log('\n==================================================');
    console.log(`REMINDER: Jangan lupa "${activeHabit.name}"!`);
    console.log('==================================================\n');
  }

  stopReminder() {
    if (this.reminderTimer) {
      clearInterval(this.reminderTimer);
      this.reminderTimer = null;
    }
  }

  // simpan ke dalam file
  saveToFile() {
    const data = {
      user: {
        name: this.user.name,
        createdAt: this.user.createdAt,
        notes: this.user.notes,
      },
      habits: this.habits,
    };
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Gagal menyimpan data:', err.message);
    }
  }

  // load dari file
  loadFromFile() {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        this.user = new UserProfile();
        this.habits = [];
        this.saveToFile();
        return;
      }
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(raw);
      this.user = new UserProfile(data.user ?? {}); // ??
      this.habits = (data.habits ?? []).map((h) => new Habit(h)); // map() and nullish
    } catch (err) {
      console.error(
        'Gagal memuat data, menggunakan data default. Error:',
        err.message
      );
      this.user = new UserProfile();
      this.habits = [];
    }
  }

  clearAllData() {
    this.user = new UserProfile();
    this.habits = [];
    this.saveToFile();
  }
}

// Daftar Menu
async function displayMenu() {
  console.log('\n==================================================');
  console.log('HABIT TRACKER - MAIN MENU');
  console.log('==================================================');
  console.log('1. Lihat Profil');
  console.log('2. Lihat Semua Kebiasaan');
  console.log('3. Lihat Kebiasaan Aktif');
  console.log('4. Lihat Kebiasaan Selesai');
  console.log('5. Tambah Kebiasaan Baru');
  console.log('6. Tandai Kebiasaan Selesai');
  console.log('7. Hapus Kebiasaan');
  console.log('8. Lihat Statistik');
  console.log('0. Keluar');
  console.log('==================================================');
}

async function handleMenu(tracker) {
  tracker.startReminder();
  while (true) {
    await displayMenu();
    const choice = (await askQuestion('Pilih menu (nomor): ')).trim();
    switch (choice) {
      case '1':
        tracker.displayProfile();
        break;
      case '2':
        tracker.displayHabits('all');
        break;
      case '3':
        tracker.displayHabits('active');
        break;
      case '4':
        tracker.displayHabits('completed');
        break;
      case '5': {
        const name = (await askQuestion('Nama kebiasaan: ')).trim();
        const freqInput = (
          await askQuestion('Target per minggu (angka): ')
        ).trim();
        const freq = parseInt(freqInput, 10) || 1;
        const h = tracker.addHabit(name, freq);
        console.log(
          `Kebiasaan ditambahkan: ${h.name} (target ${h.targetFrequency}/minggu)`
        );
        break;
      }
      case '6': {
        if (tracker.habits.length === 0) {
          console.log('Belum ada habit.');
          break;
        }
        tracker.displayHabits('all');
        const idxInput = await askQuestion(
          'Nomor habit untuk ditandai selesai hari ini: '
        );
        const idx = parseInt(idxInput.trim(), 10);
        const res = tracker.completeHabit(idx);
        if (res.ok)
          console.log(
            `Berhasil menandai "${res.habit.name}" selesai hari ini.`
          );
        else
          console.log(
            'Gagal menandai selesai. Mungkin sudah ditandai atau input salah.'
          );
        break;
      }
      case '7': {
        tracker.displayHabits('all');
        const idxInput = await askQuestion('Nomor habit untuk dihapus: ');
        const idx = parseInt(idxInput.trim(), 10);
        const ok = tracker.deleteHabit(idx);
        if (ok) console.log('Habit berhasil dihapus.');
        else console.log('Index salah, hapus gagal.');
        break;
      }
      case '8':
        tracker.displayStats();
        break;
      case '9':
        console.log('\nMenjalankan demo loop...');
        tracker.displayHabitsWithWhile();
        tracker.displayHabitsWithFor();
        break;
      case '0':
        console.log('Keluar. Menyimpan data...');
        tracker.saveToFile();
        tracker.stopReminder();
        rl.close();
        return;
      default:
        console.log('Pilihan tidak dikenali. Silakan pilih nomor yang valid.');
    }
  }
}

// Fungsi main() untuk memulai program
async function main() {
  console.clear();
  console.log('==================================================');
  console.log('WELCOME TO HABIT TRACKER CLI - CHALLENGE 3');
  console.log('==================================================');

  const tracker = new HabitTracker();

  // Isi dengan dummy data
  if (tracker.habits.length === 0) {
    tracker.addHabit('Minum Air minimal 2 liter', 7);
    tracker.addHabit('Baca Buku minimal 30 Menit', 5);
    // tandai data dummy telah selesai
    tracker.habits[0].completions.push(formatDateISO());
    tracker.saveToFile();
  }

  await handleMenu(tracker);
}
// error catch
main().catch((err) => {
  console.error('Terjadi error:', err);
  rl.close();
});
