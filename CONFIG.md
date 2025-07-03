## 🚀 Usage

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Configure your data:**
    -   Edit `src/data/courses.json`
    -   Modify `src/data/slots.json`
    -   Update `src/data/timetable.json`

3.  **Run the development server:**
    ```bash
    pnpm dev
    ```

## 📝 Configuration Examples

### `courses.json`

Define your courses with their details.

```json
{
  "23CSE201": {
    "Subject Title": "Procedural Programming using C",
    "Faculty": {"Everyone": ["Ms. Aparna S.", "Ms. Priya R"]}
  }
}
```

### `slots.json`

Define the start and end times for your class slots.

```json
{
  "theory": {
    "1": ["08:10", "09:00"],
    "2": ["09:00", "09:50"]
  },
  "lab": {
    "1": ["08:10", "10:25"]
  }
}
```

### `timetable.json`

Assign courses to specific time slots for each day of the week.

```json
{
  "A": {
    "SubjectCode": "23CSE201",
    "occurences": {
      "Monday": {"Theory": [1, 2]},
      "Wednesday": {"Lab": [1]}
    }
  }
}
```
