package de.hsos.vs.td;

import java.io.IOException;
import javax.json.Json;
import javax.json.JsonObject;
import javax.websocket.Session;

public class Lobby {

    private Session p1;
    private Session p2;
    private String title;
    private String map;

    public Lobby(Session session, String title, String map) {
        p1 = session;
        this.title = title;
        this.map = map;
    }

    public boolean canJoin() {
        return p2 == null;
    }

    public void join(Session session) {
        p2 = session;
    }

    public void signal(Session sender, String text) {
        if (p1 == sender && p2 != null) {
            p2.getAsyncRemote().sendText(text);
        } else if (p2 == sender && p1 != null) {
            p1.getAsyncRemote().sendText(text);
        }
    }

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

    public JsonObject buildJoinRequest() {
        return Json.createObjectBuilder()
                .add("action", "join-request")
                .build();
    }

    public JsonObject buildLobbyDescription(String id) {
        return Json.createObjectBuilder()
                .add("id", id)
                .add("title", this.title)
                .add("map", this.map)
                .build();
    }

}
