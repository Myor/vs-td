package de.hsos.vs.td;

import java.util.concurrent.ConcurrentHashMap;

public class LobbyList {

    /**
     * Liste alle aktiven Lobbys.
     * 'Concurrent', damit der Zugriff über mehrere Threads möglich ist
     */
    public static final ConcurrentHashMap<String, Lobby> lobbys = new ConcurrentHashMap<>();

}
