import { useEffect, useState } from 'react'

export interface EmptyRoom {
    房屋編號: string
    房屋地址: string
    房型: string
    坪數: string
    棟別: string
    戶別: string
    '租金(含管理費)': string
    備註: string
}

export const useEmptyRoomData = () => {
    const [data, setData] = useState<EmptyRoom[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        fetch('/data/空房清單.json')
            .then(res => res.json())
            .then((json: EmptyRoom[]) => setData(json))
            .catch(err => setError(err))
            .finally(() => setLoading(false))
    }, [])

    return { data, loading, error }
}