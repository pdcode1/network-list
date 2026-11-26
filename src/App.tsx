import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import './App.css'

type Contact = {
  id: string
  name: string
  lastName: string
  nickname?: string
  number: string
}

const STORAGE_KEY = 'contacts'
const ITEMS_PER_PAGE = 10

function App() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Form state
  const [name, setName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nickname, setNickname] = useState('')
  const [number, setNumber] = useState('')

  // App state
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  
  // Modals state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editForm, setEditForm] = useState<Contact | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
  }, [contacts])

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const checkDuplicateNumber = (num: string, excludeId?: string) => {
    return contacts.some((c) => c.number.replace(/\D/g, '') === num.replace(/\D/g, '') && c.id !== excludeId)
  }

  // ---------- CRUD ACTIONS ----------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !lastName.trim() || !number.trim()) return

    if (checkDuplicateNumber(number)) {
      showToast('Não foi possível salvar, este número já está cadastrado.')
      setSearch(number) // Filtra pelo número existente
      return
    }

    const newContact: Contact = {
      id: crypto.randomUUID(),
      name: name.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim() || undefined,
      number: number.trim(),
    }

    setContacts((prev) => [...prev, newContact])
    resetForm()
    showToast('Contato adicionado com sucesso!', 'success')
  }

  const handleDelete = () => {
    if (!deleteId) return
    setContacts((prev) => prev.filter((c) => c.id !== deleteId))
    setDeleteId(null)
    showToast('Contato excluído.', 'success')
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm) return

    if (!editForm.name.trim() || !editForm.lastName.trim() || !editForm.number.trim()) return

    if (checkDuplicateNumber(editForm.number, editForm.id)) {
      showToast('Não foi possível salvar, este número já está cadastrado.')
      setSearch(editForm.number)
      setEditingContact(null)
      setEditForm(null)
      return
    }

    setContacts((prev) => prev.map((c) => c.id === editForm.id ? editForm : c))
    setEditingContact(null)
    setEditForm(null)
    showToast('Contato atualizado com sucesso!', 'success')
  }

  const resetForm = () => {
    setName('')
    setLastName('')
    setNickname('')
    setNumber('')
  }

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact)
    setEditForm({ ...contact })
  }

  // ---------- EXPORT ACTIONS ----------
  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(contacts, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "contacts.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    const tableData = contacts.map(c => [c.name, c.lastName, c.nickname || '-', c.number])
    
    autoTable(doc, {
      head: [['Nome', 'Sobrenome', 'Apelido', 'Número']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
    })
    doc.save("contacts.pdf")
  }

  // ---------- FILTER & PAGINATION ----------
  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase().replace(/\D/g, '')
    const searchStr = search.toLowerCase()
    
    // Se a busca for apenas números, compara apenas o número
    if (q.length > 0 && /^\d+$/.test(q)) {
      return c.number.replace(/\D/g, '').includes(q)
    }

    return (
      c.name.toLowerCase().includes(searchStr) ||
      c.lastName.toLowerCase().includes(searchStr) ||
      (c.nickname && c.nickname.toLowerCase().includes(searchStr)) ||
      c.number.includes(searchStr)
    )
  })

  const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedContacts = filteredContacts.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <main className="app">
      <header className="app-header">
        <h1>Network Contacts</h1>
        <p className="subtitle">
          {contacts.length} {contacts.length === 1 ? 'contato salvo' : 'contatos salvos'}
        </p>
      </header>

      {/* Controles: Busca e Exportação */}
      <div className="controls">
        <input
          className="search"
          type="text"
          placeholder="🔍  Buscar por nome, apelido ou número..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="export-group">
          <button className="btn btn-outline" onClick={exportJSON}>JSON</button>
          <button className="btn btn-outline" onClick={exportPDF}>PDF</button>
        </div>
      </div>

      {/* Formulário de Adição */}
      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input type="text" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="text" placeholder="Sobrenome" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="form-row">
          <input type="text" placeholder="Apelido (Opcional)" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          <input type="tel" placeholder="Número de telefone" value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary">Adicionar contato</button>
      </form>

      {/* Lista de Contatos */}
      {paginatedContacts.length === 0 ? (
        <p className="empty">
          {contacts.length === 0 ? 'Nenhum contato ainda. Adicione o primeiro acima 👆' : 'Nenhum resultado encontrado.'}
        </p>
      ) : (
        <ul className="contact-list">
          {paginatedContacts
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((contact) => (
            <li key={contact.id} className="contact-item">
              <div className="avatar">
                {contact.name.charAt(0).toUpperCase()}
                {contact.lastName.charAt(0).toUpperCase()}
              </div>
              <div className="contact-info">
                <strong>
                  {contact.name} {contact.lastName}
                  {contact.nickname && <span className="nickname">({contact.nickname})</span>}
                </strong>
                <span>{contact.number}</span>
              </div>
              <div className="contact-actions">
                <button className="icon-btn" onClick={() => openEditModal(contact)} title="Editar">✏️</button>
                <button className="icon-btn danger" onClick={() => setDeleteId(contact.id)} title="Excluir">🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
            className="btn btn-ghost"
          >
            Anterior
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)}
            className="btn btn-ghost"
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal de Edição */}
      {editingContact && editForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Editar Contato</h2>
            <form onSubmit={handleUpdate} className="contact-form">
              <div className="form-row">
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Nome" />
                <input type="text" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} placeholder="Sobrenome" />
              </div>
              <div className="form-row">
                <input type="text" value={editForm.nickname || ''} onChange={e => setEditForm({...editForm, nickname: e.target.value})} placeholder="Apelido" />
                <input type="tel" value={editForm.number} onChange={e => setEditForm({...editForm, number: e.target.value})} placeholder="Número" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => { setEditingContact(null); setEditForm(null); }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Excluir Contato</h2>
            <p>Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleDelete}>Sim, excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast / Popup de Mensagem */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </main>
  )
}

export default App