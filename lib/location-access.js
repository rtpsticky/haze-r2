export function getReadScopeWhere(user) {
    if (!user) return null

    if (user.role === 'ADMIN' || user.role === 'HEALTH_REGION') {
        return {}
    }

    if (user.role === 'SSJ' && user.location?.provinceName) {
        return {
            location: {
                provinceName: user.location.provinceName
            }
        }
    }

    return {
        locationId: user.locationId
    }
}

export async function canReadLocation(prisma, user, locationId) {
    if (!user || !locationId) return false

    const targetLocationId = parseInt(locationId)
    if (Number.isNaN(targetLocationId)) return false

    if (user.role === 'ADMIN' || user.role === 'HEALTH_REGION') {
        return true
    }

    if (user.role === 'SSJ') {
        const targetLocation = await prisma.location.findUnique({
            where: { id: targetLocationId },
            select: { provinceName: true }
        })

        return targetLocation?.provinceName === user.location?.provinceName
    }

    return targetLocationId === user.locationId
}
