package de.hsos.vs.td;

import java.io.IOException;
import javax.json.Json;
import javax.json.JsonObject;
import javax.websocket.Session;

/**
 * Klasse für eine Lobby, in der zwei Spieler beitreten können
 * Es werden je zwei WebSocket Sessions gespeichert, um Signale auszutauschen
 */
public class Lobby {

    private Session p1;
    private Session p2;
    private String title;
    private String map;

    /**
     *
     * @param session Session des Erstellers
     * @param title Titel der Lobby
     * @param map Karte die gespielt werden soll
     */
    public Lobby(Session session, String title, String map) {
        p1 = session;
        this.title = title;
        this.map = map;
    }

    /**
     * @return true, wenn der zweite Platz noch frei ist
     */
    public boolean canJoin() {
        return p2 == null;
    }

    /**
     * @param session Session der zweiten Verbindung
     */
    public void join(Session session) {
        p2 = session;
    }

    /**
     * Sende text an die jeweils andere Session
     *
     * @param sender Die Session des Senders
     * @param text text zum senden
     */
    public void signal(Session sender, String text) {
        if (p1 == sender && p2 != null) {
            p2.getAsyncRemote().sendText(text);
        } else if (p2 == sender && p1 != null) {
            p1.getAsyncRemote().sendText(text);
        }
    }

    /**
     * Beim entfernen einer Session werden beide Verbindungen beendet
     * So kann die Lobby sofort gelöscht werden
     *
     * @param session Session, welche die Lobby verlässt
     * @return  true, wenn die Session in der Lobby war, sonst false
     * @throws IOException
     */
    public boolean quit(Session session) throws IOException {

        if (session != p1 && session != p2) {
            return false;
        }

        if (p1 != null && p1.isOpen()) {
            p1.close();
        }
        if (p2 != null && p2.isOpen()) {
            p2.close();
        }
        return true;

    }

    /**
     * Baut die Anfrage für den Session Ersteller,
     * damit dieser den Beitritt eines weiteren Spieler erfährt
     *
     * @return JsonObjekt für die Anfrage
     */
    public JsonObject buildJoinRequest() {
        return Json.createObjectBuilder()
                .add("action", "join-request")
                .build();
    }

    /**
     * Baut ein Objekt, dass Infos über die Lobby enthällt
     *
     * @param id ID der Lobby
     * @return JsonObjekt mit allen Infos
     */
    public JsonObject buildLobbyDescription(String id) {
        return Json.createObjectBuilder()
                .add("id", id)
                .add("title", this.title)
                .add("map", this.map)
                .build();
    }

}
