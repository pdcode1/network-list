import { useEffect, useState } from 'react'
import './App.css'

type Contact = {
  id: string
  name: string
  lastName: string
  number: string
}

const STORAGE_KEY = 'contacts'

function App() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [name, setName] = useState('')
  const [lastName, setLastName] = useState('')
  const [number, setNumber] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
  }, [contacts])

  const resetForm = () => {
    setName('')
    setLastName('')
    setNumber('')
    setEditingId(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !lastName.trim() || !number.trim()) return

    if (editingId) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, name: name.trim(), lastName: lastName.trim(), number: number.trim() }
            : c
        )
      )
    } else {
      const newContact: Contact = {
        id: crypto.randomUUID(),
        name: name.trim(),
        lastName: lastName.trim(),
        number: number.trim(),
      }
      setContacts((prev) => [...prev, newContact])
    }
    resetForm()
  }

  const handleEdit = (contact: Contact) => {
    setName(contact.name)
    setLastName(contact.lastName)
    setNumber(contact.number)
    setEditingId(contact.id)
  }

  const handleDelete = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
    if (editingId === id) resetForm()
  }

  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.number.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <section className="app">
        <h1>Network Contacts</h1>

        <form className="contact-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <input
            type="tel"
            placeholder="Number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <button type="submit">{editingId ? 'Update' : 'Add'}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>

        <input
          className="search"
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filteredContacts.length === 0 ? (
          <p className="empty">No contacts yet.</p>
        ) : (
          <ul className="contact-list">
            {filteredContacts.map((contact) => (
              <li key={contact.id} className="contact-item">
                <div className="contact-info">
                  <strong>
                    {contact.name} {contact.lastName}
                  </strong>
                  <span>{contact.number}</span>
                </div>
                <div className="contact-actions">
                  <button onClick={() => handleEdit(contact)}>Edit</button>
                  <button onClick={() => handleDelete(contact.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default App