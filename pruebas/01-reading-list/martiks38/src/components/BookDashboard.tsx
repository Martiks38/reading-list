'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useBookList } from '@/hooks/useBookList'
import { useFilters } from '@/hooks/useFilters'

import { BookList } from './BookList'
import { FilterSection } from './Filter/FilterSection'

import homeStyles from '@/assets/styles/Layout/Home.module.css'
import bookDashboardStyles from '@/assets/styles/Book/BookDashboard.module.css'
import bookFinderAvailableStyles from '@/assets/styles/Book/BookFinderAvailable.module.css'
import { filterBook } from '@/helpers/filterBook'

const initialViews = { bookListAvailable: true, readingList: true, mode: 'desktop' }

export function BookDashboard() {
  const [filterWord, setFilterWord] = useState('')
  const [seeLists, setSeeLists] = useState<typeof initialViews>(initialViews)
  const { range, currentGenre } = useFilters()
  const { listBooksAvailable, readingList } = useBookList()
  const searchId = useId()
  const setTimeoutId = useRef<number | undefined>(undefined)
  const isFirstRender = useRef(true)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth

      const changeDashboardView = width < 881

      if (seeLists.mode === 'desktop' && changeDashboardView) {
        setSeeLists({ bookListAvailable: true, readingList: false, mode: 'mobile' })
      }

      if (!changeDashboardView) setSeeLists(initialViews)
    }

    if (isFirstRender.current) {
      handleResize()
      isFirstRender.current = false
    }

    const throttle = (callback: () => void, delay: number) => {
      let lastCall = 0
      return function () {
        const now = new Date().getTime()
        if (now - lastCall >= delay) {
          lastCall = now
          callback()
        }
      }
    }

    const throttledHandleResize = throttle(handleResize, 200)

    window.addEventListener('resize', throttledHandleResize)

    return () => window.removeEventListener('resize', throttledHandleResize)
  }, [seeLists])

  const changeList = (type: 'available' | 'reading') => {
    setSeeLists((prevViews) => ({
      ...prevViews,
      bookListAvailable: !prevViews.bookListAvailable,
      readingList: !prevViews.readingList
    }))
  }

  const changeFilterWord = (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (setTimeoutId.current) window.clearTimeout(setTimeoutId.current)

    const { value } = ev.currentTarget

    setTimeoutId.current = window.setTimeout(() => setFilterWord(value.trim() || ''), 400)
  }

  const currentListBooksAvailable = listBooksAvailable.filter(({ genre, pages, title }) =>
    filterBook({
      currentGenre,
      genre,
      maxNumberPages: range.currentNumberPages,
      pages,
      title,
      word: filterWord
    })
  )

  const currentReadingList = readingList.filter(({ genre, pages }) =>
    filterBook({ currentGenre, genre, maxNumberPages: range.currentNumberPages, pages })
  )

  return (
    <article className={homeStyles.homeMain__bookDashboard}>
      <FilterSection />
      <menu className={bookDashboardStyles.bookListMenu}>
        <li>
          <button
            className={`${bookDashboardStyles.bookListMenu__item} ${
              seeLists.bookListAvailable ? bookDashboardStyles.active : ''
            }`}
            onClick={() => changeList('available')}
          >
            Ver libros disponibles
          </button>
        </li>
        <li>
          <button
            className={`${bookDashboardStyles.bookListMenu__item} ${
              seeLists.readingList ? bookDashboardStyles.active : ''
            }`}
            onClick={() => changeList('reading')}
          >
            Ver lista de lectura
          </button>
        </li>
      </menu>

      {seeLists.bookListAvailable && (
        <section className={bookDashboardStyles.bookListSection}>
          <h2 className={bookDashboardStyles.bookListSection__title}>
            Libros disponibles&nbsp;
            {currentListBooksAvailable.length !== 0 ? currentListBooksAvailable.length : ''}
          </h2>
          <form className={bookFinderAvailableStyles.searchContainer}>
            <label
              htmlFor={`${searchId}-search`}
              className={bookFinderAvailableStyles.searchContainer__label}
            >
              Buscar libro:
            </label>
            <input
              type='search'
              name={`${searchId}-search`}
              id={`${searchId}-search`}
              className={bookFinderAvailableStyles.searchContainer__input}
              placeholder='La llamada de Cthulhu'
              onChange={changeFilterWord}
            />
          </form>
          {currentListBooksAvailable.length !== 0 ? (
            <BookList books={currentListBooksAvailable} listType='available' />
          ) : (
            <p className={bookFinderAvailableStyles.searchContainer__message}>
              {filterWord
                ? `No se encontraron libros que coincidan con ${filterWord}`
                : 'No hay libros disponibles'}
            </p>
          )}
        </section>
      )}
      {seeLists.readingList && (
        <section className={bookDashboardStyles.bookListSection}>
          <h2 className={bookDashboardStyles.bookListSection__title}>
            Lista de lectura&nbsp;
            {currentReadingList.length !== 0 ? currentReadingList.length : ''}
          </h2>
          {currentReadingList.length !== 0 ? (
            <BookList books={currentReadingList} listType='reading' />
          ) : (
            <>
              <p className={bookFinderAvailableStyles.searchContainer__message}>
                No hay libros en la lista.
              </p>
              <p className={bookFinderAvailableStyles.searchContainer__message}>
                A qué esperas para sumergirte en una nueva aventura.
              </p>
            </>
          )}
        </section>
      )}
    </article>
  )
}
