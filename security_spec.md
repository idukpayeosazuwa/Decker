# Security Specification: Decker Binder Engine

## 1. Data Invariants
1. **Course Invariants**:
   - Must contain a valid alphanumeric `id` of size <= 128.
   - `code` must be a string of size <= 20.
   - `name` must be a string of size <= 100.
   - `color` must be a string of size <= 50.
   - `createdAt` must be set to the server timestamp `request.time`.
2. **Note Invariants**:
   - Must reside inside a valid course parent document.
   - `id` must be a valid alphanumeric string of size <= 128.
   - `courseId` must match the parent `{courseId}` exactly.
   - `title` must be a string of size <= 100.
   - `order` must be an integer >= 1.
   - `images` must be a list of size >= 1 and <= 50.
   - `ocrStatus` must be one of: 'idle', 'processing', 'completed', 'failed'.
   - `createdAt` must be set to the server timestamp `request.time`.

---

## 2. The "Dirty Dozen" Malicious Payloads

### Payload 1: ID Poisoning on Courses Collection
An attacker tries to inject a massive 2MB string as a Document ID.
- **Document Path**: `/courses/JUNK_ID_VERY_LONG_STRING_THAT_REACHES_MEGA_SIZES...`
- **Result**: `PERMISSION_DENIED` (ID size check fails).

### Payload 2: Hostile Unauthenticated Writes to Courses
An unauthenticated guest user tries to create a new Course document.
- **Action**: Create `/courses/csc101`
- **Payload**: `{"code": "CSC101", "name": "Intro to Programming", "color": "indigo", "createdAt": request.time}`
- **Result**: `PERMISSION_DENIED` (Not signed in).

### Payload 3: Spoofed Course Timestamp on Creation
An authenticated user tries to set the course's `createdAt` time to a custom historical timestamp instead of `request.time`.
- **Payload**: `{"id": "csc101", "code": "CSC101", "name": "Calculus I", "color": "teal", "createdAt": "2000-01-01T00:00:00Z"}`
- **Result**: `PERMISSION_DENIED` (`createdAt` must equal `request.time`).

### Payload 4: Overlong Field Injection in Course Code
An attacker tries to inject a massive string into the course `code` field to exhaust storage.
- **Payload**: `{"id": "csc101", "code": "CSC101_LONG_BLABLA_THAT_EXCEEDS_MAX_TWENTY_CHARACTERS_HERE", "name": "Algebra", "color": "rose", "createdAt": request.time}`
- **Result**: `PERMISSION_DENIED` (`code.size() <= 20` enforcement).

### Payload 5: Missing Required Fields in Course
Creating a Course with missing `id` or `color` properties.
- **Payload**: `{"code": "CSC301", "name": "Software Engineering", "createdAt": request.time}`
- **Result**: `PERMISSION_DENIED` (`keys().hasAll(...)` check failed).

### Payload 6: Modifying Immortal Course Fields
An attacker attempts to modify `createdAt` or `id` during a course update.
- **Payload**: `{"id": "modified-id", "code": "CSC101", "name": "New Name", "color": "indigo", "createdAt": "2026-05-22T20:42:00Z"}`
- **Result**: `PERMISSION_DENIED` (Immutable check failed).

### Payload 7: Hostile Unauthenticated Writes to Notes
An unauthenticated attacker tries to insert a lecture slide into `/courses/csc101/notes/slide1`.
- **Payload**: `{"id": "slide1", "courseId": "csc101", "title": "Week 1", "order": 1, "images": ["data:image/svg+xml;utf8,..."], "ocrStatus": "idle", "createdAt": request.time}`
- **Result**: `PERMISSION_DENIED` (Requires signed-in user).

### Payload 8: Mismatched Note courseId
An attacker tries to upload a Note into `/courses/csc101/notes/slide1` but sets `courseId` to `"math202"`.
- **Payload**: `{"id": "slide1", "courseId": "math202", "title": "Complex numbers", "order": 1, "images": ["data:..."], "ocrStatus": "idle", "createdAt": request.time}`
- **Result**: `PERMISSION_DENIED` (`courseId` must match path variable `courseId`).

### Payload 9: Invalid OCR Status Enum Value
An attacker tries to set `ocrStatus` to an unsupported status like `"hacked"`.
- **Payload**: `{"id": "slide1", "courseId": "csc101", "title": "Week 1", "order": 2, "images": ["data:..."], "ocrStatus": "hacked", "createdAt": request.time}`
- **Result**: `PERMISSION_DENIED` (Enum validation fails).

### Payload 10: Empty Images Array for Slides Note
Attacking the storage by uploading a Note with an empty or abnormally huge images list.
- **Payload**: `{"id": "slide1", "courseId": "csc101", "title": "Slide", "order": 1, "images": [], "ocrStatus": "idle", "createdAt": request.time}`
- **Result**: `PERMISSION_DENIED` (`images.size() >= 1` validation).

### Payload 11: Invalid Non-Integer Note Order
Setting step sequence `order` of note to a negative number or float.
- **Payload**: `{"id": "slide1", "courseId": "csc101", "title": "Slide", "order": -5, "images": ["data:..."], "ocrStatus": "idle", "createdAt": request.time}`
- **Result**: `PERMISSION_DENIED` (`order >= 1` and type is integer).

### Payload 12: Phantom Field Hijack during Note Update
Updating a Note and appending an unauthorized custom attribute `isAdmin: true` list.
- **Payload**: `{"id": "slide1", "courseId": "csc101", "title": "Week 1 Title Edit", "order": 1, "images": ["data:..."], "ocrStatus": "completed", "createdAt": "2026-05-22T20:00:00Z", "isAdmin": true}`
- **Result**: `PERMISSION_DENIED` (Affected keys checklist block).
